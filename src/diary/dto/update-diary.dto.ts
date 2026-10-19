import { CreateDiaryDto } from "./create-diary.dto";
import { PartialType } from "@nestjs/swagger";

export class UpdateDiaryDto extends PartialType(CreateDiaryDto) {}