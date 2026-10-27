export const NODE_ENVIRONMENTS = [
  'local',
  'development',
  'production',
] as const;
export type Environment = (typeof NODE_ENVIRONMENTS)[number];

export type AppConfig = {
  nodeEnv: Environment;
  port: number;
  webOrigin: string;
};
