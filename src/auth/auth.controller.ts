import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    console.log('Auth Controller - changePassword - Request user:', JSON.stringify({
      id: req.user.id,
      sub: req.user.sub,
      userId: req.user.userId,
      email: req.user.email
    }));

    console.log('Auth Controller - changePassword - Request body:', JSON.stringify({
      current_password_length: changePasswordDto.current_password?.length || 0,
      new_password_length: changePasswordDto.new_password?.length || 0
    }));

    // Usar o ID do usuário do token JWT
    const userId = req.user.sub || req.user.id || req.user.userId;

    if (!userId) {
      console.error('Auth Controller - changePassword - ID do usuário não encontrado no token');
      throw new Error('ID do usuário não encontrado no token');
    }

    return this.authService.changePassword(userId, changePasswordDto);
  }
}
