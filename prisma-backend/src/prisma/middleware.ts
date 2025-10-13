import { Prisma } from '@prisma/client';
import { getContext } from '../context/requestContext';

export function attachTenantMiddleware(prisma: any){
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    const ctx = getContext();
    const tenantId = ctx.tenantId;
    // only apply to findMany/findUnique/update/delete on tenant-scoped models
    const tenantModels = ['Lead','Customer','Deal','Communication','TravelPackage','Booking','User'];
    if(tenantId && tenantModels.includes(params.model || '')){
      if(params.action === 'findMany' || params.action === 'findUnique' || params.action === 'update' || params.action === 'delete'){
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        // inject tenant filter if not present
        if(!('tenant_id' in params.args.where)){
          params.args.where = { AND: [ params.args.where, { tenant_id: tenantId } ] };
        }
      }
    }
    return next(params);
  });
}
