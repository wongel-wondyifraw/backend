import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { join, extname } from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class MembersService {
    constructor(
        @InjectRepository(Member)
        private readonly membersRepository: Repository<Member>,
    ) { }

    async create(dto: CreateMemberDto, avatar?: Express.Multer.File, doc?: Express.Multer.File): Promise<Member> {
        // 1. Save member first to generate the UUID
        const member = await this.membersRepository.save(this.membersRepository.create(dto));
        const updateData: Partial<Member> = {};
        const baseDir = join(process.cwd(), 'uploads');

        // 2. Handle Avatar (Rename by UUID)
        // Check for .buffer to ensure it's a real file, not a metadata object
        if (avatar && avatar.buffer) {
            const avatarName = `${member.id}${extname(avatar.originalname)}`;
            const fullPath = join(baseDir, 'images', avatarName);

            await fs.mkdir(join(baseDir, 'images'), { recursive: true });
            await fs.writeFile(fullPath, avatar.buffer);
            updateData.image_url = `/uploads/images/${avatarName}`;
        }

        // 3. Handle Document (Rename by UUID + Timestamp)
        if (doc && doc.buffer) {
            const timestamp = Date.now();
            const docName = `${member.id}_${timestamp}${extname(doc.originalname)}`;
            const fullPath = join(baseDir, 'documents', docName);

            await fs.mkdir(join(baseDir, 'documents'), { recursive: true });
            await fs.writeFile(fullPath, doc.buffer);
            updateData.document_url = `/uploads/documents/${docName}`;
        }

        // 4. Final Update if files were uploaded
        if (Object.keys(updateData).length > 0) {
            await this.membersRepository.update(member.id, updateData);
            return { ...member, ...updateData };
        }

        return member;
    }

    async findAll(): Promise<Member[]> {
        return this.membersRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Member> {
        const member = await this.membersRepository.findOne({
            where: { id },
            relations: ['ministry_members', 'ministry_members.ministry']
        });
        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }

    async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
        await this.membersRepository.update(id, updateMemberDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.membersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
    }
}
