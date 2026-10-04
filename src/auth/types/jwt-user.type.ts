import { RolesEnum } from "../../users/enum/roles-enum";

export interface JwtUser {
    sub: string;
    email: string;
    role: RolesEnum;
    refreshToken?: string;
}