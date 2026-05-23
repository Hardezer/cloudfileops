import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileStatusDto } from './dto/update-file-status.dto';
import { FilesService } from './files.service';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
};

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presigned-url')
  createPresignedUrl(
    @Body() createPresignedUrlDto: CreatePresignedUrlDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.createPresignedUrl(createPresignedUrlDto, user);
  }

  @Post()
  create(
    @Body() createFileDto: CreateFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.create(createFileDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.filesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.filesService.findOne(id, user);
  }

  @Get(':id/errors')
  findErrors(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.filesService.findErrors(id, user);
  }

  @Patch(':id/confirm-upload')
  confirmUpload(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.confirmUpload(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateFileStatusDto: UpdateFileStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.updateStatus(id, updateFileStatusDto, user);
  }
}
