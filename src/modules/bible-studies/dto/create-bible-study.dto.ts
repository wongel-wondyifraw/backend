import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";
import { BIBLE_BOOKS } from "../../../common/constants/bible-books";

export class CreateBibleStudyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsIn(["book", "study_material"])
  content_type: "book" | "study_material";

  @ValidateIf((o: CreateBibleStudyDto) => o.content_type === "book")
  @IsString()
  @IsNotEmpty({ message: "Bible book is required when content type is Book" })
  @IsIn([...BIBLE_BOOKS], { message: "Invalid Bible book" })
  bible_book?: string;

  @ValidateIf((o: CreateBibleStudyDto) => o.content_type === "study_material")
  @IsString()
  @IsOptional()
  material_url?: string;

  @IsUUID()
  @IsOptional()
  leader_id?: string | null;

  @ValidateIf((o: CreateBibleStudyDto) => !!o.leader_id)
  @IsIn(["member", "minister"])
  @IsOptional()
  leader_type?: "member" | "minister" | null;
}
