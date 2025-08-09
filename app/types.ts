import type { ProfileContent } from "applesauce-core/helpers/profile";

export type Relay = string;

export type Pubkey = string;

export type Author = ProfileContent;

export type Article = {
  author: Author;
  title: string;
  identifier: string;
  content: string;
  publishedAt: string;
  tags: string[];
};
