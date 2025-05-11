import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Raw } from 'typeorm';
import { Commission, CommissionStatus } from './entities/commission.entity';
import { CommissionConfig } from './entities/commission-config.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommissionConfigDto } from './dto/create-commission-config.dto';
import { UpdateCommissionConfigDto } from './dto/update-commission-config.dto';
import { UpdateCommissionStatusDto } from './dto/update-commission-status.dto';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(CommissionConfig)
    private commissionConfigRepository: Repository<CommissionConfig>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
  ) {}

  // Commission Config Methods
  async createCommissionConfig(storeId: string, createCommissionConfigDto: CreateCommissionConfigDto): Promise<CommissionConfig> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Check if there's already an active config
    const existingConfig = await this.commissionConfigRepository.findOne({
      where: { store: { id: storeId }, isActive: true },
    });

    if (existingConfig) {
      // Deactivate the existing config
      existingConfig.isActive = false;
      await this.commissionConfigRepository.save(existingConfig);
    }

    // Create new config
    const newConfig = this.commissionConfigRepository.create({
      store,
      rate: createCommissionConfigDto.rate,
      description: createCommissionConfigDto.description,
      isActive: true,
    });

    return this.commissionConfigRepository.save(newConfig);
  }

  async getCommissionConfig(storeId: string): Promise<CommissionConfig> {
    console.log('Getting commission config for store:', storeId);

    const config = await this.commissionConfigRepository.findOne({
      where: { store: { id: storeId }, isActive: true },
      relations: ['store'],
    });

    if (!config) {
      console.log('No active commission config found, creating default config');
      // If no config exists, create a default one
      const defaultConfig = await this.createCommissionConfig(storeId, { rate: 5.00 });
      console.log('Default commission config created:', defaultConfig);
      return defaultConfig;
    }

    console.log('Found active commission config:', config);
    return config;
  }

  async updateCommissionConfig(storeId: string, configId: string, updateCommissionConfigDto: UpdateCommissionConfigDto): Promise<CommissionConfig> {
    const config = await this.commissionConfigRepository.findOne({
      where: { id: configId, store: { id: storeId } },
    });

    if (!config) {
      throw new NotFoundException(`Commission config with ID ${configId} not found in store with ID ${storeId}`);
    }

    // Update fields
    if (updateCommissionConfigDto.rate !== undefined) {
      config.rate = updateCommissionConfigDto.rate;
    }
    if (updateCommissionConfigDto.description !== undefined) {
      config.description = updateCommissionConfigDto.description;
    }
    if (updateCommissionConfigDto.isActive !== undefined) {
      config.isActive = updateCommissionConfigDto.isActive;
    }

    return this.commissionConfigRepository.save(config);
  }

  async getCommissionConfigHistory(storeId: string): Promise<CommissionConfig[]> {
    return this.commissionConfigRepository.find({
      where: { store: { id: storeId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Commission Methods
  async createCommission(sale: Sale): Promise<Commission | null> {
    console.log('Creating commission for sale:', sale.id);

    // Check if the sale has a seller
    if (!sale.seller) {
      console.log('No seller associated with sale, skipping commission creation');
      return null;
    }

    console.log('Seller found:', sale.seller.id, sale.seller.name);

    // Check if the seller has commissions enabled
    const storeUser = await this.storeUserRepository.findOne({
      where: {
        user: { id: sale.seller.id },
        store: { id: sale.store.id }
      }
    });

    if (!storeUser) {
      console.log('Store user not found, skipping commission creation');
      return null;
    }

    // Check if the seller is an owner - owners don't receive commissions
    if (storeUser.role === 'owner') {
      console.log('Seller is an owner, owners do not receive commissions, skipping commission creation');
      return null;
    }

    if (!storeUser.receiveCommissions) {
      console.log('Seller has commissions disabled, skipping commission creation');
      return null;
    }

    console.log('Seller has commissions enabled, proceeding with commission creation');

    // Get the active commission config
    const config = await this.getCommissionConfig(sale.store.id);
    console.log('Commission config:', config);

    // Calculate commission amount
    const commissionAmount = Number(sale.total) * (Number(config.rate) / 100);
    console.log('Calculated commission amount:', commissionAmount);

    // Create commission record
    const commission = this.commissionRepository.create({
      store: sale.store,
      seller: sale.seller,
      sale: sale,
      amount: commissionAmount,
      rate: config.rate,
      saleTotal: sale.total,
      status: CommissionStatus.PENDING,
    });

    console.log('Commission record created, saving to database...');
    const savedCommission = await this.commissionRepository.save(commission);
    console.log('Commission saved successfully with ID:', savedCommission.id);

    return savedCommission;
  }

  async cancelCommission(saleId: string, storeId: string): Promise<Commission | null> {
    const commission = await this.commissionRepository.findOne({
      where: { sale: { id: saleId }, store: { id: storeId } },
    });

    if (!commission) {
      return null;
    }

    commission.status = CommissionStatus.CANCELED;
    return this.commissionRepository.save(commission);
  }

  async updateCommissionStatus(storeId: string, commissionId: string, updateStatusDto: UpdateCommissionStatusDto): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId, store: { id: storeId } },
      relations: ['seller', 'sale'],
    });

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${commissionId} not found in store with ID ${storeId}`);
    }

    // Update status
    commission.status = updateStatusDto.status;

    // If status is PAID, set paidAt date
    if (updateStatusDto.status === CommissionStatus.PAID) {
      commission.paidAt = new Date();
    } else {
      commission.paidAt = null;
    }

    return this.commissionRepository.save(commission);
  }

  async getCommissionById(storeId: string, commissionId: string): Promise<Commission> {
    const commission = await this.commissionRepository.findOne({
      where: { id: commissionId, store: { id: storeId } },
      relations: ['seller', 'sale', 'store'],
    });

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${commissionId} not found in store with ID ${storeId}`);
    }

    return commission;
  }

  async getTodayCommissionsBySeller(storeId: string, sellerId: string): Promise<Commission[]> {
    console.log('Service - getTodayCommissionsBySeller - Input params:', {
      storeId,
      sellerId
    });

    const whereCondition: any = {
      store: { id: storeId },
      seller: { id: sellerId },
      createdAt: Raw(alias => `DATE(${alias}) = CURRENT_DATE`)
    };

    console.log('Where condition for TODAY:', JSON.stringify(whereCondition, null, 2));

    const commissions = await this.commissionRepository.find({
      where: whereCondition,
      relations: ['seller', 'sale'],
      order: { createdAt: 'DESC' },
    });

    console.log('Found', commissions.length, 'TODAY commissions for seller');

    if (commissions.length > 0) {
      console.log('Sample TODAY commission:', {
        id: commissions[0].id,
        amount: commissions[0].amount,
        status: commissions[0].status,
        createdAt: commissions[0].createdAt,
        saleId: commissions[0].sale?.id
      });
    } else {
      // If no commissions found, let's check if there are any commissions at all for this seller
      const allCommissions = await this.commissionRepository.find({
        where: {
          seller: { id: sellerId },
        },
        relations: ['seller', 'sale'],
      });

      console.log('Total commissions for this seller (without filters):', allCommissions.length);

      if (allCommissions.length > 0) {
        console.log('Sample commission:', {
          id: allCommissions[0].id,
          amount: allCommissions[0].amount,
          status: allCommissions[0].status,
          createdAt: allCommissions[0].createdAt,
          saleId: allCommissions[0].sale?.id
        });
      }
    }

    return commissions;
  }

  async getCommissionsBySeller(storeId: string, sellerId: string, startDate?: Date, endDate?: Date): Promise<Commission[]> {
    console.log('Service - getCommissionsBySeller - Input params:', {
      storeId,
      sellerId,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined
    });

    const whereCondition: any = {
      store: { id: storeId },
      seller: { id: sellerId },
    };

    // Add date range if provided
    if (startDate && endDate) {
      console.log('Applying date filter with raw dates:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Usar o filtro Between diretamente, sem tentar ser muito inteligente
      // Isso garante que o filtro funcione de forma consistente
      whereCondition.createdAt = Between(startDate, endDate);

      console.log('Applied Between filter with:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } else {
      console.log('No date filter applied');
    }

    console.log('Final where condition:', JSON.stringify(whereCondition, null, 2));

    const commissions = await this.commissionRepository.find({
      where: whereCondition,
      relations: ['seller', 'sale'],
      order: { createdAt: 'DESC' },
    });

    console.log('Found', commissions.length, 'commissions');

    // Log each commission for debugging
    if (commissions.length === 0) {
      // If no commissions found, let's check if there are any commissions at all for this seller
      const allCommissions = await this.commissionRepository.find({
        where: {
          seller: { id: sellerId },
        },
        relations: ['seller', 'sale'],
      });

      console.log('Total commissions for this seller (without filters):', allCommissions.length);

      if (allCommissions.length > 0) {
        console.log('Sample commission:', {
          id: allCommissions[0].id,
          amount: allCommissions[0].amount,
          status: allCommissions[0].status,
          createdAt: allCommissions[0].createdAt,
          saleId: allCommissions[0].sale?.id
        });
      }
    }

    return commissions;
  }

  async getCommissionsByStore(storeId: string, status?: CommissionStatus, startDate?: Date, endDate?: Date): Promise<Commission[]> {
    console.log('Service - getCommissionsByStore - Input params:', {
      storeId,
      status,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined
    });

    const whereCondition: any = {
      store: { id: storeId },
    };

    // Add status filter if provided
    if (status) {
      whereCondition.status = status;
    }

    // Add date range if provided
    if (startDate && endDate) {
      console.log('Applying date filter with raw dates:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Usar o filtro Between diretamente, sem tentar ser muito inteligente
      // Isso garante que o filtro funcione de forma consistente
      whereCondition.createdAt = Between(startDate, endDate);

      console.log('Applied Between filter with:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } else {
      console.log('No date filter applied');
    }

    console.log('Final where condition:', JSON.stringify(whereCondition, null, 2));

    const commissions = await this.commissionRepository.find({
      where: whereCondition,
      relations: ['seller', 'sale'],
      order: { createdAt: 'DESC' },
    });

    console.log('Found', commissions.length, 'commissions');

    return commissions;
  }

  async getCommissionSummaryBySeller(storeId: string, sellerId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const commissions = await this.getCommissionsBySeller(storeId, sellerId, startDate, endDate);

    // Calculate totals
    const totalCommissions = commissions.length;
    const totalAmount = commissions.reduce((sum, commission) => {
      if (commission.status !== CommissionStatus.CANCELED) {
        return sum + Number(commission.amount);
      }
      return sum;
    }, 0);

    const pendingAmount = commissions
      .filter(commission => commission.status === CommissionStatus.PENDING)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const paidAmount = commissions
      .filter(commission => commission.status === CommissionStatus.PAID)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    return {
      totalCommissions,
      totalAmount,
      pendingAmount,
      paidAmount,
      commissions,
    };
  }

  async getCommissionSummaryByStore(storeId: string, startDate?: Date, endDate?: Date): Promise<any> {
    console.log('Service - getCommissionSummaryByStore - Date params:', {
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined
    });

    const commissions = await this.getCommissionsByStore(storeId, undefined, startDate, endDate);

    console.log('Service - getCommissionSummaryByStore - Found', commissions.length, 'commissions');

    // Calculate totals
    const totalCommissions = commissions.length;
    const totalAmount = commissions.reduce((sum, commission) => {
      if (commission.status !== CommissionStatus.CANCELED) {
        return sum + Number(commission.amount);
      }
      return sum;
    }, 0);

    const pendingAmount = commissions
      .filter(commission => commission.status === CommissionStatus.PENDING)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const paidAmount = commissions
      .filter(commission => commission.status === CommissionStatus.PAID)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    // Group by seller
    const sellerSummaries = {};
    commissions.forEach(commission => {
      if (!commission.seller) return;

      const sellerId = commission.seller.id;
      const sellerName = commission.seller.name;

      if (!sellerSummaries[sellerId]) {
        sellerSummaries[sellerId] = {
          sellerId,
          sellerName,
          totalCommissions: 0,
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
        };
      }

      sellerSummaries[sellerId].totalCommissions++;

      if (commission.status !== CommissionStatus.CANCELED) {
        sellerSummaries[sellerId].totalAmount += Number(commission.amount);

        if (commission.status === CommissionStatus.PENDING) {
          sellerSummaries[sellerId].pendingAmount += Number(commission.amount);
        } else if (commission.status === CommissionStatus.PAID) {
          sellerSummaries[sellerId].paidAmount += Number(commission.amount);
        }
      }
    });

    return {
      totalCommissions,
      totalAmount,
      pendingAmount,
      paidAmount,
      sellerSummaries: Object.values(sellerSummaries),
    };
  }
}
