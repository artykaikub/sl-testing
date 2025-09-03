import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { isError } from 'src/utils/type-guards';

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private stripPassword(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  private async findUserByIdInternal(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.usersRepository.findOneBy({
      username: createUserDto.username,
    });
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    try {
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        this.saltRounds,
      );

      const userEntity = this.usersRepository.create({
        username: createUserDto.username,
        role: createUserDto.role,
        password: hashedPassword,
      });

      const savedUser = await this.usersRepository.save(userEntity);
      return this.stripPassword(savedUser);
    } catch (error: unknown) {
      if (isError(error)) {
        throw new InternalServerErrorException(
          `Could not create user: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'An unknown error occurred while creating the user.',
      );
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.stripPassword(user));
  }

  async findOneById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findUserByIdInternal(id);
    return this.stripPassword(user);
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findUserByIdInternal(id);

    const dataToUpdate: Partial<UpdateUserDto> = { ...updateUserDto };

    try {
      if (updateUserDto.password) {
        dataToUpdate.password = await bcrypt.hash(
          updateUserDto.password,
          this.saltRounds,
        );
      }

      const updatedUserEntity = this.usersRepository.merge(user, dataToUpdate);
      const savedUser = await this.usersRepository.save(updatedUserEntity);

      return this.stripPassword(savedUser);
    } catch (error: unknown) {
      if (isError(error)) {
        throw new InternalServerErrorException(
          `Could not update user: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'An unknown error occurred while updating the user.',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }
}
