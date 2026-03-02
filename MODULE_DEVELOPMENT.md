# Module Development Template - ResilientEcho

Template and guide for developing new modules in the ResilientEcho backend.

## Module Structure

Every module follows this standardized structure:

```
src/modules/[module-name]/
├── [module-name].module.ts          # NestJS module definition
├── [module-name].controller.ts      # HTTP REST endpoints
├── [module-name].service.ts         # Business logic
├── [module-name].service.spec.ts    # Unit tests
├── dtos/
│   ├── create-[entity].dto.ts       # POST request schema
│   ├── update-[entity].dto.ts       # PATCH request schema
│   ├── [entity].response.dto.ts     # Response schema
│   └── index.ts
├── entities/
│   └── [entity].entity.ts           # TypeScript interfaces
└── guards/
    └── [module].guard.ts            # Optional: Custom authorization
```

## Step 1: Define Data Types

### Entity Interface
```typescript
// src/modules/[module]/entities/[entity].entity.ts

export interface [Entity] {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: '[ENUM]';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum [Entity]Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}
```

### Prisma Schema
```prisma
// prisma/schema.prisma

model [Entity] {
  id            String   @id @default(cuid())
  userId        String
  name          String
  description   String?
  status        [Entity]Status  @default(ACTIVE)
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId])
  @@index([status])
  @@fulltext([name, description]) // For full-text search
}

enum [Entity]Status {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

## Step 2: Create DTOs

### Request DTO
```typescript
// src/modules/[module]/dtos/create-[entity].dto.ts

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class Create[Entity]Dto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
```

### Response DTO
```typescript
// src/modules/[module]/dtos/[entity].response.dto.ts

export class [Entity]ResponseDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor([entity]: [Entity]) {
    this.id = [entity].id;
    this.userId = [entity].userId;
    this.name = [entity].name;
    this.description = [entity].description;
    this.status = [entity].status;
    this.createdAt = [entity].createdAt;
    this.updatedAt = [entity].updatedAt;
  }
}
```

### Index DTOs
```typescript
// src/modules/[module]/dtos/index.ts

export * from './create-[entity].dto';
export * from './[entity].response.dto';
```

## Step 3: Create Service

```typescript
// src/modules/[module]/[module].service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { [Entity]ResponseDto } from './dtos';
import { Create[Entity]Dto } from './dtos';

@Injectable()
export class [Module]Service {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new [entity]
   * 
   * @param userId - User creating the [entity]
   * @param data - [Entity] creation data
   * @returns Created [entity] with sanitized fields
   */
  async create(userId: string, data: Create[Entity]Dto): Promise<[Entity]ResponseDto> {
    try {
      const [entity] = await this.prisma.[entity].create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          metadata: data.metadata || {},
        },
      });

      return new [Entity]ResponseDto([entity]);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate [entity] name for user');
      }
      throw error;
    }
  }

  /**
   * Get [entity] by ID
   * 
   * @param id - [Entity] ID
   * @param userId - User requesting (ownership check)
   * @returns [Entity] or throws NotFoundException
   */
  async findById(id: string, userId: string): Promise<[Entity]ResponseDto> {
    const [entity] = await this.prisma.[entity].findFirst({
      where: { id, userId },
    });

    if (!entity) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    return new [Entity]ResponseDto([entity]);
  }

  /**
   * List all [entity] for user
   * 
   * @param userId - User ID
   * @param skip - Pagination offset
   * @param take - Pagination limit
   * @returns Paginated [entity] list
   */
  async listByUser(
    userId: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: [Entity]ResponseDto[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.[entity].findMany({
        where: { userId, status: '[ENTITY]Status.ACTIVE' },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.[entity].count({ where: { userId } }),
    ]);

    return {
      data: data.map((item) => new [Entity]ResponseDto(item)),
      total,
    };
  }

  /**
   * Update [entity]
   * 
   * @param id - [Entity] ID
   * @param userId - User updating (ownership check)
   * @param data - Updated data
   * @returns Updated [entity]
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Create[Entity]Dto>,
  ): Promise<[Entity]ResponseDto> {
    // Verify ownership
    const existing = await this.prisma.[entity].findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    const updated = await this.prisma.[entity].update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return new [Entity]ResponseDto(updated);
  }

  /**
   * Delete [entity] (soft delete)
   * 
   * @param id - [Entity] ID
   * @param userId - User deleting (ownership check)
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.[entity].findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`[Entity] with ID ${id} not found`);
    }

    await this.prisma.[entity].update({
      where: { id },
      data: { status: '[ENTITY]Status.ARCHIVED' },
    });
  }

  /**
   * Advanced search with filters
   */
  async search(
    userId: string,
    filters: {
      query?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<[Entity]ResponseDto[]> {
    return this.prisma.[entity].findMany({
      where: {
        userId,
        status: filters.status || '[ENTITY]Status.ACTIVE',
        name: filters.query ? { search: filters.query } : undefined,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

## Step 4: Create Controller

```typescript
// src/modules/[module]/[module].controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtGuard } from '@common/guards/jwt.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { [Module]Service } from './[module].service';
import { Create[Entity]Dto, [Entity]ResponseDto } from './dtos';

/**
 * [Module] Controller
 * Endpoints: POST/GET/PATCH/DELETE /:resource
 * Auth: Requires JWT token (JwtGuard)
 */
@Controller('api/v1/[module]')
@UseGuards(JwtGuard)
export class [Module]Controller {
  constructor(private readonly service: [Module]Service) {}

  /**
   * POST /:resource
   * Create new [entity]
   * 
   * @param userId - Current user (from JWT)
   * @param createDto - Request body
   */
  @Post()
  @HttpCode(201)
  async create(
    @CurrentUser() userId: string,
    @Body() createDto: Create[Entity]Dto,
  ): Promise<{ data: [Entity]ResponseDto }> {
    const data = await this.service.create(userId, createDto);
    return { data };
  }

  /**
   * GET /:resource
   * List [entity] for current user
   */
  @Get()
  async list(
    @CurrentUser() userId: string,
    @Query('skip') skip = '0',
    @Query('take') take = '10',
  ): Promise<{ data: [Entity]ResponseDto[]; total: number }> {
    const result = await this.service.listByUser(
      userId,
      parseInt(skip),
      parseInt(take),
    );
    return result;
  }

  /**
   * GET /:resource/search
   * Advanced search with filters
   */
  @Get('search')
  async search(
    @CurrentUser() userId: string,
    @Query('q') query?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ data: [Entity]ResponseDto[] }> {
    const data = await this.service.search(userId, {
      query,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { data };
  }

  /**
   * GET /:resource/:id
   * Get [entity] by ID
   */
  @Get(':id')
  async findById(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<{ data: [Entity]ResponseDto }> {
    const data = await this.service.findById(id, userId);
    return { data };
  }

  /**
   * PATCH /:resource/:id
   * Update [entity]
   */
  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<Create[Entity]Dto>,
  ): Promise<{ data: [Entity]ResponseDto }> {
    const data = await this.service.update(id, userId, updateDto);
    return { data };
  }

  /**
   * DELETE /:resource/:id
   * Delete (soft delete) [entity]
   */
  @Delete(':id')
  @HttpCode(204)
  async delete(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.delete(id, userId);
  }
}
```

## Step 5: Create Module

```typescript
// src/modules/[module]/[module].module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '@database/prisma.module';
import { CryptoModule } from '@shared/crypto/crypto.module';
import { [Module]Service } from './[module].service';
import { [Module]Controller } from './[module].controller';

/**
 * [Module] Module
 * Encapsulates all [module-related] functionality
 * 
 * Imports:
 * - PrismaModule: Database access
 * - CryptoModule: Cryptographic utilities
 * 
 * Exports:
 * - [Module]Service: For use in other modules
 */
@Module({
  imports: [PrismaModule, CryptoModule],
  providers: [[Module]Service],
  controllers: [[Module]Controller],
  exports: [[Module]Service],
})
export class [Module]Module {}
```

## Step 6: Register Module

Add to `app.module.ts`:

```typescript
// src/app.module.ts

import { [Module]Module } from '@modules/[module]/[module].module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    PrismaModule,
    CryptoModule,
    AuthModule,
    [Module]Module, // ← Add new module here
  ],
})
export class AppModule {}
```

## Step 7: Create Tests

```typescript
// src/modules/[module]/[module].service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { [Module]Service } from './[module].service';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('[Module]Service', () => {
  let service: [Module]Service;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [Module]Service,
        {
          provide: PrismaService,
          useValue: {
            [entity]: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<[Module]Service>([Module]Service);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create new [entity]', async () => {
      const userId = 'user123';
      const createDto = {
        name: 'Test [Entity]',
        description: 'Test description',
      };

      (prismaService.[entity].create as jest.Mock).mockResolvedValue({
        id: '[entity]123',
        userId,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(userId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(prismaService.[entity].create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId, ...createDto }),
      });
    });
  });

  describe('findById', () => {
    it('should return [entity] if owned by user', async () => {
      const [entity] = {
        id: '[entity]123',
        userId: 'user123',
        name: 'Test [Entity]',
      };

      (prismaService.[entity].findFirst as jest.Mock).mockResolvedValue([entity]);

      const result = await service.findById('[entity]123', 'user123');

      expect(result.name).toBe('[entity].name');
    });

    it('should throw NotFoundException if [entity] not found', async () => {
      (prismaService.[entity].findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('[entity]123', 'user123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

## Example: HazardOracle Module

### Real-world implementation for hazard detection:

```typescript
// src/modules/hazard-oracle/hazard-oracle.service.ts

@Injectable()
export class HazardOracleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly noaa: NoaaService,
    private readonly usgs: UsgsService,
  ) {}

  /**
   * Get active hazards near user location
   */
  async getHazardsNear(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<HazardResponseDto[]> {
    // Query PostGIS for geospatial search
    const hazards = await this.prisma.$queryRaw`
      SELECT * FROM "Hazard"
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2)::geography, 4326),
        $3 * 1000
      )
      AND status = 'ACTIVE'
      ORDER BY severity DESC
      LIMIT 20
    `;

    return hazards.map((h) => new HazardResponseDto(h));
  }

  /**
   * Fuse multiple hazard sources with Bayesian probability
   */
  async fuseSources(location: string): Promise<FusedHazardDto> {
    const [noaaData, usgsData, sentinelData] = await Promise.all([
      this.noaa.getAlerts(location),
      this.usgs.getEarthquakes(location),
      this.sentinel.getImagery(location),
    ]);

    // Bayesian fusion: P(H|E) = P(E|H) * P(H) / P(E)
    const fused = this.bayesianFusion([noaaData, usgsData, sentinelData]);

    return fused;
  }

  /**
   * TinyML anomaly detection on sensor data
   */
  async detectAnomalies(
    sensorData: number[],
  ): Promise<{ anomalyScore: number; isAnomaly: boolean }> {
    // Load TensorFlow Lite model
    const model = await tf.loadLayersModel('file://models/anomaly.json');
    const input = tf.tensor2d([sensorData]);
    const output = model.predict(input) as tf.Tensor;
    const [score] = await output.data();

    return {
      anomalyScore: score,
      isAnomaly: score > 0.7, // Threshold
    };
  }
}
```

## Development Checklist

- [ ] Create Prisma schema and run migrations
- [ ] Create DTOs with validation
- [ ] Implement service with full CRUD + search
- [ ] Create controller with proper methods
- [ ] Create module and register in AppModule
- [ ] Write unit tests (>80% coverage)
- [ ] Write E2E tests for all endpoints
- [ ] Add Swagger documentation
- [ ] Security review (OWASP)
- [ ] Performance testing
- [ ] Integration testing with other modules
- [ ] Documentation (API, setup, examples)
- [ ] Code review & merge

## Module Checklist Template

```markdown
## [Module] Development Checklist

### Phase 1: Design
- [ ] Data model defined (Prisma schema)
- [ ] API endpoints designed (RESTful)
- [ ] Integration points identified
- [ ] Security requirements documented

### Phase 2: Implementation
- [ ] DTOs created with validation
- [ ] Service implemented
- [ ] Controller implemented
- [ ] Module created and registered
- [ ] Unit tests written (>80%)
- [ ] E2E tests written

### Phase 3: Testing
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Performance tests passing

### Phase 4: Documentation
- [ ] API documentation (Swagger)
- [ ] Setup guide
- [ ] Code comments
- [ ] Examples provided

### Phase 5: Deployment
- [ ] Code review passed
- [ ] PR approved
- [ ] Merged to main
- [ ] Deployed to staging
- [ ] Deployed to production
```

## Best Practices

✅ **Always**
- Use dependency injection (NestJS providers)
- Validate input with class-validator
- Handle errors with proper HTTP status codes
- Write tests (unit + E2E)
- Document code with JSDoc
- Follow folder structure
- Use DTOs for all I/O

❌ **Never**
- Expose sensitive fields in responses
- Skip error handling
- Hardcode configuration
- Write logic in controllers
- Commit without tests
- Log sensitive data

---

**Template Complete**: Ready to develop new modules following this structure.
