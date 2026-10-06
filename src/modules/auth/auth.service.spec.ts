import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<UsersService, "findOneByEmail" | "create">
  >;
  let jwtService: jest.Mocked<Pick<JwtService, "signAsync">>;
  let config: jest.Mocked<Pick<ConfigService, "get">>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    password_hash: "hashed",
    is_active: true,
    first_name: "Test",
    middle_name: "",
    last_name: "User",
    role: "staff",
  };

  beforeEach(() => {
    usersService = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
    };
    config = {
      get: jest.fn(),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe("register", () => {
    it("throws when public registration is disabled", async () => {
      config.get.mockReturnValue("false");

      await expect(
        service.register({
          fullName: "Jane Doe",
          email: "jane@example.com",
          password: "secret1",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws when email already exists", async () => {
      config.get.mockReturnValue("true");
      usersService.findOneByEmail.mockResolvedValue(mockUser as never);

      await expect(
        service.register({
          fullName: "Jane Doe",
          email: "jane@example.com",
          password: "secret1",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("creates user when registration is enabled", async () => {
      config.get.mockReturnValue("true");
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: "user-2",
        email: "jane@example.com",
      } as never);

      const result = await service.register({
        fullName: "Jane Doe",
        email: "Jane@Example.com",
        password: "secret1",
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "jane@example.com",
          first_name: "Jane",
          last_name: "Doe",
          role: "staff",
        }),
      );
      expect(result.message).toBe("User registered successfully");
    });
  });

  describe("login", () => {
    it("throws for unknown email", async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "missing@example.com", password: "secret1" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws for inactive account", async () => {
      usersService.findOneByEmail.mockResolvedValue({
        ...mockUser,
        is_active: false,
      } as never);

      await expect(
        service.login({ email: "test@example.com", password: "secret1" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws for invalid password", async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("returns token and user on success", async () => {
      usersService.findOneByEmail.mockResolvedValue({
        ...mockUser,
        roleEntity: { key: "staff", permissions: [] },
      } as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: "test@example.com",
        password: "secret1",
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: "user-1",
          email: "test@example.com",
        },
        { expiresIn: "24h" },
      );
      expect(result.access_token).toBe("signed-token");
      expect(result.user.email).toBe("test@example.com");
    });

    it("issues a 30-day token when remember_me is true", async () => {
      usersService.findOneByEmail.mockResolvedValue({
        ...mockUser,
        roleEntity: { key: "staff", permissions: [] },
      } as never);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({
        email: "test@example.com",
        password: "secret1",
        remember_me: true,
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: "user-1",
          email: "test@example.com",
        },
        { expiresIn: "30d" },
      );
    });
  });
});
