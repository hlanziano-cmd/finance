// src/services/organization.service.ts
// @ts-nocheck

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';
import type { Organization, OrganizationMembership } from '@/src/types/models';
import type {
  CreateOrganizationDTO,
  PaginatedResponse,
  PaginationParams,
} from '@/src/types/dtos';
import { createOrganizationSchema } from '@/src/types/dtos';
import { DatabaseError, ValidationError, NotFoundError, ForbiddenError } from '@/src/lib/errors';

export class OrganizationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Obtener organización por ID
   */
  async getById(id: string): Promise<Organization> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Organización no encontrada');
      }
      throw new DatabaseError(error.message);
    }

    return this.mapOrganizationFromDB(data);
  }

  /**
   * Listar organizaciones del usuario actual
   */
  async list(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Organization>> {
    let query = this.supabase
      .from('v_user_organizations')
      .select('*', { count: 'exact' });

    // Paginación
    if (pagination) {
      const { page, pageSize } = pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError(error.message);
    }

    const totalItems = count || 0;
    const pageSize = pagination?.pageSize || totalItems;
    const currentPage = pagination?.page || 1;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: data.map(this.mapOrganizationFromView) as Organization[],
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  /**
   * Crear una organización
   */
  async create(dto: CreateOrganizationDTO): Promise<Organization> {
    // Validar DTO
    const validation = createOrganizationSchema.safeParse(dto);
    if (!validation.success) {
      throw new ValidationError(validation.error.issues.map(issue => ({
        message: issue.message,
        path: issue.path.map(String),
      })));
    }

    // Obtener el usuario actual
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Insertar organización
    const { data, error } = await this.supabase
      .from('organizations')
      .insert({
        name: dto.name,
        legal_name: dto.legalName,
        tax_id: dto.taxId,
        country: dto.country || 'CO',
        currency: dto.currency || 'COP',
        industry: dto.industry,
        size: dto.size,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ValidationError([{
          message: 'El NIT/Tax ID ya está registrado',
          path: ['taxId']
        }]);
      }
      throw new DatabaseError(error.message);
    }

    return this.mapOrganizationFromDB(data as any);
  }

  /**
   * Actualizar organización
   */
  async update(
    id: string,
    updates: Partial<CreateOrganizationDTO>
  ): Promise<Organization> {
    // Verificar permisos (admin o owner)
    await this.checkPermission(id, 'admin');

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.legalName) updateData.legal_name = updates.legalName;
    if (updates.industry) updateData.industry = updates.industry;
    if (updates.size) updateData.size = updates.size;

    const { data, error } = await this.supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return this.mapOrganizationFromDB(data as any);
  }

  /**
   * Eliminar organización
   */
  async delete(id: string): Promise<void> {
    // Solo el owner puede eliminar
    await this.checkPermission(id, 'owner');

    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }

  /**
   * Agregar miembro a la organización
   */
  async addMember(
    organizationId: string,
    userId: string,
    role: 'admin' | 'analyst' | 'viewer' = 'viewer'
  ): Promise<OrganizationMembership> {
    // Verificar permisos (admin o owner)
    await this.checkPermission(organizationId, 'admin');

    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        status: 'pending',
        invited_by: user?.id,
      })
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ValidationError([{
          message: 'El usuario ya es miembro de esta organización',
          path: ['userId']
        }]);
      }
      throw new DatabaseError(error.message);
    }

    return this.mapMembershipFromDB(data as any);
  }

  /**
   * Actualizar rol de miembro
   */
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: 'admin' | 'analyst' | 'viewer'
  ): Promise<OrganizationMembership> {
    await this.checkPermission(organizationId, 'admin');

    const { data, error } = await this.supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return this.mapMembershipFromDB(data as any);
  }

  /**
   * Eliminar miembro
   */
  async removeMember(organizationId: string, memberId: string): Promise<void> {
    await this.checkPermission(organizationId, 'admin');

    const { error } = await this.supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }

  /**
   * Listar miembros de una organización
   */
  async listMembers(organizationId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data.map(this.mapMembershipFromDB);
  }

  /**
   * Verificar permisos del usuario
   */
  private async checkPermission(
    organizationId: string,
    requiredRole: 'owner' | 'admin'
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await this.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw new ForbiddenError('No tienes acceso a esta organización');
    }

    const roleHierarchy: Record<string, number> = {
      owner: 4,
      admin: 3,
      analyst: 2,
      viewer: 1,
    };

    const userLevel = roleHierarchy[data.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenError('No tienes permisos suficientes');
    }
  }

  /**
   * Mappers
   */
  private mapOrganizationFromDB(data: any): Organization {
    return {
      id: data.id,
      name: data.name,
      taxId: data.tax_id,
      country: data.country,
      currency: data.currency,
      subscriptionPlan: data.subscription_plan,
      subscriptionStatus: data.subscription_status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapOrganizationFromView(data: any): Organization {
    return {
      id: data.organization_id,
      name: data.organization_name,
      taxId: '', // No disponible en la vista
      country: '',
      currency: '',
      subscriptionPlan: data.subscription_plan,
      subscriptionStatus: data.subscription_status,
      createdAt: new Date(data.organization_created_at),
      updatedAt: new Date(data.organization_created_at),
    };
  }

  private mapMembershipFromDB(data: any): OrganizationMembership {
    return {
      organizationId: data.organization_id,
      organization: this.mapOrganizationFromDB(data.organization),
      role: data.role,
      status: data.status,
      permissions: data.permissions || [],
    };
  }
}
