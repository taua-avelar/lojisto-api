import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreditSalesService } from './credit-sales.service';

@Injectable()
export class CreditSalesScheduler {
  private readonly logger = new Logger(CreditSalesScheduler.name);

  constructor(private readonly creditSalesService: CreditSalesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUpdateOverdueInstallments() {
    this.logger.log('Atualizando parcelas vencidas...');
    try {
      await this.creditSalesService.updateOverdueInstallments();
      this.logger.log('Parcelas vencidas atualizadas com sucesso');
    } catch (error) {
      this.logger.error('Erro ao atualizar parcelas vencidas', error);
    }
  }
}
