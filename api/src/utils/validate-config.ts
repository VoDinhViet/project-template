import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';

export function validateConfig<TEnvironment extends object>(
  rawEnvironment: Record<string, unknown>,
  validatorClass: ClassConstructor<TEnvironment>,
): TEnvironment {
  const environment = plainToInstance(validatorClass, rawEnvironment, {
    enableImplicitConversion: true,
  });
  const validationErrors = validateSync(environment, {
    skipMissingProperties: false,
  });

  if (validationErrors.length > 0) {
    const problems = validationErrors
      .map((validationError) =>
        Object.values(validationError.constraints ?? {}).join(', '),
      )
      .join('; ');
    throw new Error(`Invalid environment configuration: ${problems}`);
  }

  return environment;
}
