import { CreateDiaryDto } from "./create-diary.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateDiaryDto extends PartialType(CreateDiaryDto) {}