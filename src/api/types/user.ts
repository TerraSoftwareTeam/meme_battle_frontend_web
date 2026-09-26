export interface UserDto {
  id: string;
  username: string;
  is_guest: boolean;
  created_at?: string;
  modified_at?: string;
}

export interface UpdateMeDto {
  username?: string;
  password?: string;
}

export interface SearchUserDto {
  id?: string;
  username?: string;
  handle?: string;
}

// Auth Types

export interface AuthBody {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface GuestAuthDto {
  username?: string;
}

export interface AuthUserDto {
  username: string;
  password?: string;
}

export interface RefreshSessionDto {
  refresh_token: string;
}

export interface RegisterAuthUserDto {
  username: string;
  password?: string;
}

export interface ChangePasswordDto {
  new_password: string;
}
