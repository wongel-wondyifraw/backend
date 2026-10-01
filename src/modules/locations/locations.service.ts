import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Location } from "./entities/location.entity";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async findAll(status?: string): Promise<Location[]> {
    if (status) {
      return this.locationRepo.find({
        where: { status },
        order: { name: "ASC" },
      });
    }
    return this.locationRepo.find({ order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException("Location not found");
    return location;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const trimmedName = dto.name.trim();
    // Check for existing location (case-insensitive)
    const existing = await this.locationRepo.findOne({
      where: { name: ILike(trimmedName) },
    });

    if (existing) {
      // Return existing instead of throwing duplicate error
      return existing;
    }

    const location = this.locationRepo.create({
      ...dto,
      name: trimmedName,
    });
    return this.locationRepo.save(location);
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    if (dto.name) {
      location.name = dto.name.trim();
    }
    if (dto.status) {
      location.status = dto.status;
    }
    if (dto.parent_id !== undefined) {
      location.parent_id = dto.parent_id;
    }

    return this.locationRepo.save(location);
  }
}
