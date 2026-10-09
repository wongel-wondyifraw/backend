import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  NotFoundException,
  Body,
  Patch,
  ParseUUIDPipe,
  Delete,
  Request,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "crypto";
import { UsersService } from "./users.service";
import { PinoLogger } from "nestjs-pino";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserListQueryDto } from "./dto/user-list-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import {
  createAvatarImageDiskStorage,
  imageFileFilter,
  imageUploadLimits,
} from "../../common/config/multer.config";
import { LocalStorageService } from "../uploads/local-storage.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
    private readonly storage: LocalStorageService,
  ) {
    this.logger.setContext("UsersController");
  }

  @Get()
  @RequiresPermissions("users.read")
  async findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
      {
        role: query.role,
        status: query.status,
        origin: query.origin,
      },
    );
  }

  @Get("profile")
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.findOne(req.user.id, true);
  }

  @Patch("profile")
  @RequiresPermissions("settings.update")
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.update(req.user.id, updateProfileDto);
  }

  @Patch("change-password")
  @RequiresPermissions("settings.update")
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get(":id")
  @RequiresPermissions("users.read")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id, true);
  }

  @Patch(":id")
  @RequiresPermissions("users.manage")
  async update(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Post()
  @RequiresPermissions("users.manage")
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: createAvatarImageDiskStorage(),
      fileFilter: imageFileFilter,
      limits: imageUploadLimits,
    }),
  )
  async create(
    @Request() req: { user: { id: string; role: string } },
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const userId = randomUUID();
    let avatarUrl: string | null = null;

    if (file) {
      try {
        const processed = await this.storage.uploadImage(file);
        avatarUrl = processed.url;
      } catch (err) {
        this.logger.error({ err }, "Error processing avatar during creation");
      }
    }

    return this.usersService.create(
      {
        ...createUserDto,
        id: userId,
        avatar_url: avatarUrl,
        created_at: new Date(),
      },
      req.user,
    );
  }

  @Delete(":id")
  @RequiresPermissions("users.manage")
  async remove(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.usersService.remove(id, req.user);
  }

  @Post(":id/restore")
  @RequiresPermissions("users.manage")
  async restore(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.usersService.restore(id, req.user);
  }

  @Post(":id/admin-reset-password")
  @RequiresPermissions("users.manage")
  async adminResetPassword(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.usersService.adminResetPassword(id, req.user);
  }

  @Post(":id/force-logout")
  @RequiresPermissions("users.manage")
  async forceLogout(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.usersService.forceLogout(id, req.user);
  }

  @Get("profile/export")
  @RequiresPermissions("settings.read")
  async exportMyData(@Request() req: { user: { id: string } }) {
    if (!req.user?.id)
      throw new UnauthorizedException("User not authenticated");
    return this.usersService.exportData(req.user.id);
  }

  @Post("profile/request-deletion")
  @RequiresPermissions("settings.read")
  async requestDeletion(@Request() req: { user: { id: string } }) {
    if (!req.user?.id)
      throw new UnauthorizedException("User not authenticated");
    await this.usersService.anonymize(req.user.id, req.user.id);
    return {
      message: "Account has been scheduled for deletion and anonymized",
    };
  }

  @Post(":id/anonymize")
  @RequiresPermissions("users.manage")
  async anonymizeUser(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.usersService.anonymize(id, req.user.id);
    return { message: "User successfully anonymized and soft-deleted" };
  }

  @Post(":id/invite")
  @RequiresPermissions("users.manage")
  async invite(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.usersService.inviteUser(id, req.user);
  }

  @Post(":id/upload-avatar")
  @RequiresPermissions("settings.update", "users.manage")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: createAvatarImageDiskStorage(),
      fileFilter: imageFileFilter,
      limits: imageUploadLimits,
    }),
  )
  async uploadAvatar(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    try {
      if (!file) {
        throw new NotFoundException("File not found");
      }
      const processed = await this.storage.uploadImage(file);
      await this.usersService.updateAvatar(id, processed.url);
      return {
        message: "Avatar uploaded successfully",
        avatar_url: processed.url,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        {
          userId: id,
          fileMetadata: file
            ? {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
              }
            : null,
          errorMessage: err.message,
        },
        "Failed to upload avatar",
      );
      throw error;
    }
  }
}
