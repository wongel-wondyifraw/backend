import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { LocalStorageService } from "./local-storage.service";

@Module({
  controllers: [UploadsController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class UploadsModule {}
