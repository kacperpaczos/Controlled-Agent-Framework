import { z } from "zod"

export const VERSION = "0.0.1"

export const VersionSchema = z.literal(VERSION)

export const IDSchema = z.string().min(1)

export const TimestampSchema = z.number().int().nonnegative()
