import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { SaveProcessingResultDto } from './dto/save-processing-result.dto';
import { ProcessingService } from './processing.service';

@Controller('internal/files')
@UseGuards(InternalApiKeyGuard)
export class ProcessingController {
  constructor(private readonly processingService: ProcessingService) {}

  @Post(':id/processing-result')
  saveProcessingResult(
    @Param('id') id: string,
    @Body() saveProcessingResultDto: SaveProcessingResultDto,
  ) {
    return this.processingService.saveProcessingResult(
      id,
      saveProcessingResultDto,
    );
  }
}
