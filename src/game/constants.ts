export const PLAYER_RADIUS = 14;
export const PLAYER_ACCEL = 0.6;
export const PLAYER_FRICTION = 0.88;
export const PLAYER_MAX_SPEED = 8;
export const PLAYER_TRAIL_LENGTH = 12;
export const PLAYER_INVULN_FRAMES = 60;
export const PLAYER_FLICKER_INTERVAL = 4;
export const TRAIL_FADE = 0.08;

export const ORB_SPAWN_INTERVAL = 70;
export const ORB_CAP_TIME = 600;
export const ORB_MIN_RADIUS = 14;
export const ORB_MAX_RADIUS = 28;
export const ORB_HUE_MIN = 160;
export const ORB_HUE_MAX = 240;
export const ORB_MIN_SPEED = 0.5;
export const ORB_MAX_SPEED = 1.7;
export const ORB_SAFE_DISTANCE = 100;
export const ORB_SPAWN_ATTEMPTS = 10;

export const SPIKE_SPAWN_INTERVAL_START = 90;
export const SPIKE_SPAWN_INTERVAL_MIN = 20;
export const SPIKE_BASE_SPEED = 1.4;
export const SPIKE_SPEED_VARIANCE = 1.2;
export const SPIKE_SPEED_MAX_BONUS = 2;
export const SPIKE_SPEED_TIME_FACTOR = 0.0008;
export const SPIKE_SCATTER = 200;
export const SPIKE_OFFSCREEN_MARGIN = 80;
export const SPIKE_ROTATION_SPEED = 0.08;
export const SPIKE_POINTS = 12;

export const HEART_SPAWN_INTERVAL = 1100;
export const HEART_LIFETIME = 600;
export const HEART_BLINK_THRESHOLD = 120;
export const HEART_BLINK_INTERVAL = 8;
export const HEART_MAX_SPEED = 0.6;
export const HEART_RADIUS = 16;

export const COMBO_TIMEOUT = 90;
export const POINTS_PER_ORB = 10;

export const MAX_LIVES = 5;
export const INITIAL_LIVES = 3;

export const SHAKE_SPIKE_HIT = 24;
export const SHAKE_ORB_BASE = 4;
export const SHAKE_ORB_COMBO = 0.4;
export const SHAKE_HEART = 6;
export const SHAKE_DECAY = 0.88;

export const PARTICLE_DECAY_MIN = 0.018;
export const PARTICLE_DECAY_RANGE = 0.02;
export const PARTICLE_FRICTION = 0.94;

export const FLOAT_TEXT_RISE = 1.2;
export const FLOAT_TEXT_FADE = 0.02;

export const MOTION_BLUR_ALPHA = 0.25;

export const HIGH_SCORE_KEY = 'pop:highscore';
export const CONTROL_MODE_KEY = 'pop:controlmode';
export const PLAYER_MOUSE_DEAD_ZONE = 8;

// Boss
export const BOSS_RADIUS = 32;
export const BOSS_HP = 8;
export const BOSS_SPAWN_INTERVAL = 1800;
export const BOSS_ESCAPE_FRAMES = 2400;
export const BOSS_DEATH_DELAY = 30;
export const BOSS_GOLD_SPAWN_RADIUS = 150;
export const BOSS_BULLET_RADIUS = 5;
export const BOSS_BULLET_SPEED = 2.5;
export const BOSS_RING_INTERVAL = 120;
export const BOSS_RING_COUNT = 12;
export const BOSS_SPIRAL_INTERVAL = 8;
export const BOSS_AIMED_INTERVAL = 90;
export const BOSS_AIMED_SPREAD = (15 * Math.PI) / 180;
export const BOSS_WOBBLE = 0.3;
export const SHAKE_BOSS_DEATH = 30;

// Powerup
export const POWERUP_SPAWN_INTERVAL = 900;
export const POWERUP_LIFETIME = 600;
export const POWERUP_BLINK_THRESHOLD = 120;
export const POWERUP_BLINK_INTERVAL = 8;
export const POWERUP_RADIUS = 16;
export const POWERUP_SHIELD_FRAMES = 480;
export const POWERUP_SLOW_FRAMES = 300;
export const POWERUP_MAGNET_FRAMES = 360;
export const POWERUP_FRENZY_FRAMES = 480;
export const POWERUP_GHOST_FRAMES = 240;
export const POWERUP_SLOW_FACTOR = 0.5;
export const POWERUP_MAGNET_FORCE = 3;
export const POWERUP_HEART_WEIGHT = 20;
export const POWERUP_OTHER_WEIGHT = 16;

// Upgrades
export const UPGRADE_SPEED_DEMON_MAXSPEED = 10;
export const UPGRADE_SPEED_DEMON_FRICTION = 0.85;
export const UPGRADE_IRON_GRIP_FRICTION = 0.93;
export const UPGRADE_COMBO_MASTER_TIMEOUT = 150;
export const UPGRADE_ORB_PULL_RADIUS = 120;
export const UPGRADE_ORB_PULL_FORCE = 2;
export const UPGRADE_LUCKY_DROP_INTERVAL = 600;
export const UPGRADE_BLITZ_RATE_MULT = 0.8;
export const UPGRADE_BLITZ_BONUS_PTS = 5;
export const UPGRADE_COLLECTOR_EXTRA = 4;
export const UPGRADE_WIDE_TRAIL_LENGTH = 22;

// Orb variants
export const ORB_GOLD_HUE = 45;
export const ORB_GOLD_RADIUS_BONUS = 6;
export const ORB_GOLD_POINTS_MULT = 3;
export const ORB_BOMB_HUE = 0;
export const ORB_BOMB_BLINK_INTERVAL = 6;
export const ORB_STANDARD_WEIGHT = 75;
export const ORB_GOLD_WEIGHT = 15;
export const ORB_BOMB_WEIGHT = 10;

// Spike variants
export const SPIKE_FAST_COLOR = '#ff44cc';
export const SPIKE_FAST_RADIUS = 10;
export const SPIKE_FAST_SPEED_MULT = 2;
export const SPIKE_HEAVY_COLOR = '#220011';
export const SPIKE_HEAVY_RADIUS = 24;
export const SPIKE_HEAVY_SPEED_MULT = 0.6;
export const SPIKE_HEAVY_DAMAGE = 2;
export const SPIKE_GHOST_FLICKER_INTERVAL = 20;
