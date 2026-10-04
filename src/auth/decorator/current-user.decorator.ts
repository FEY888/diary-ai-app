import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { JwtUser } from "../types/jwt-user.type";

export const CurrentUser = createParamDecorator((
    data: keyof JwtUser | undefined,
    context: ExecutionContext,
) => {
    const req = context.switchToHttp().getRequest();

    const user = req.user as JwtUser;

    if(!user) {
        throw new InternalServerErrorException('User데코레이터는 AccessTokenGuard와 함께 사용해야합니다.');
    }
    if(data) {
        return user[data];
    }
    return user;
});