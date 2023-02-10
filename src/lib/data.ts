import type { Result } from "surrealdb.js";
import db from "./db";

export type Book = {
  slug: string;
  title: string;
  coverUrl: string;
  description: string;
  buyLink: string;
  id: string;
};

export type Host = {
  slug: string;
  name: string;
  avatar: string;
  externalUrl: string;
  description: string;
};

export type Mp3 = {
  duration: number;
  length: number;
  url: string;
};

export type Episode = {
  publicationDate: Date;
  slug: string;
  title: string;
  description: string;
  episode: number;
  episodeUrl: string;
  id: string;
  season: Season;
  mp3: Mp3;
};

export type Expectation = {
  likeIt: boolean;
  readBefore: boolean;
  expectation: string;
};

export type Rating = {
  completed: boolean;
  book: Book;
  id: string;
  quote: string;
  rating: number;
  recommends: boolean;
  unsure: boolean;
};

export type EpisodeWithBook = Episode & {
  book?: Book;
};
export type EpisodeWithBookAndRatings = EpisodeWithBook & {
  expectations: Expectation[];
  hosts: Host[];
  ratings: { host: Host; rating: Rating }[];
  mean_rating: number;
  num_recommend: number;
  recommend_percent: number;
  season: Season;
};

export type HostWithEpisode = Host & {
  latest_episodes: EpisodeWithBook[];
};
export type HostWithExtra = Host & {
  latest_episodes: EpisodeWithBook[];
  mean_rating: number;
  seasons: Season[];
  num_seasons: number;
  recommend_percent: number;
  top_3: Rating[];
};

export type Opinion = {
  rating: number;
  recommend: boolean;
  quote: string;
  hostId: string;
};

export type Season = {
  id: number;
  season: number;
  slug: number;
};

export type SeasonWithEpisodesAndBooks = Season & {
  episodes: EpisodeWithBook[];
  books: Book[];
};

export async function getHosts() {
  return db.select<Host>("host");
}

export async function getHost(slug: string) {
  const data = await db.query<Result<HostWithExtra[]>[]>(
    `SELECT 
      *,
      array::distinct(->hosts->episode.book->included_in->season) as seasons,
      count(array::distinct(->hosts->episode.book->included_in->season)) as num_seasons,
      (SELECT * FROM $parent.id->hosts->episode ORDER BY publicationDate DESC LIMIT 5 FETCH book, season) as latest_episodes,
      type::float(math::mean(->rates.rating)) as mean_rating,
      type::float(count(->rates.recommends)/count(->rates)) as recommend_percent,
      (SELECT *, out as book FROM $parent.id->rates ORDER BY rates.rating NUMERIC ASC LIMIT 3 FETCH book) as top_3
    FROM type::thing($host, $slug)
    FETCH seasons
`,
    {
      host: "host",
      slug,
    }
  );
  return mapResult(fst(data), fst);
}

export async function getSeason(season: string) {
  const data = await db.query<Result<SeasonWithEpisodesAndBooks[]>[]>(
    `SELECT 
      *,
      <-included_in<-book as books
    FROM season
    WHERE season = $season
    FETCH episodes, episodes.book, books`,
    {
      season,
    }
  );
  return mapResult(fst(data), fst);
}
export async function getEpisode(season: string, episode: string) {
  const data = await db.query<Result<EpisodeWithBookAndRatings[]>[]>(
    `
    SELECT
      *,
      book<-expects as expectations,
      <-hosts<-host as hosts,
      count(book<-rates) as num_recommend,
      type::float(count(book<-rates.recommends)/count(book<-rates)) as recommend_percent,
      (SELECT { rating: rating, quote: quote, unsure: unsure, completed: completed } as rating, in as host FROM $parent.book<-rates FETCH host) as ratings,
      type::float(math::mean(book<-rates.rating)) as mean_rating
    FROM episode
    WHERE episode = $episode AND season.season = $season
    FETCH book, ratings, expectations, hosts, season`,
    {
      episode,
      season,
    }
  );

  return mapResult(fst(data), fst);
}

const fst = <T>([h]: T[]) => h;

function mapResult<T, U>(data: Result<T>, fn: (a: T) => U): Result<U> {
  if (data.result) {
    return {
      error: undefined,
      result: fn(data.result),
    };
  }
  return data as Result<U>;
}
