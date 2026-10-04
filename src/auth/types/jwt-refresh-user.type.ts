import { JwtUser } from "./jwt-user.type";

export interface JwtRefreshUser extends JwtUser {
    refreshToken: string;
}