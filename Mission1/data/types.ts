export type ArtifactType =
  | "image"
  | "audio"
  | "video"
  | "document"
  | "surveillance"
  | "social";

export type TellType =
  | "metadata"
  | "compression"
  | "linguistic"
  | "provenance"
  | "behavioral";

export type PlayerTag = "REAL" | "SYNTHETIC" | "UNCERTAIN";

export type ArtifactContent =
  | {
      kind: "image";
      /** Optional URL to an image asset (served from `Mission1/public` or remote). */
      assetUrl?: string;
      caption?: string;
      paletteNote?: string;
    }
  | {
      kind: "audio";
      /** Optional URL to an audio asset (served from `Mission1/public` or remote). */
      assetUrl?: string;
      transcript: string[];
      analysisNotes: string[];
    }
  | {
      kind: "video";
      /** Optional URL to a video asset (served from `Mission1/public` or remote). */
      assetUrl?: string;
      posterUrl?: string;
      caption?: string;
      analysisNotes?: string[];
    }
  | {
      kind: "document";
      header: string;
      body: string[];
      footer?: string;
    }
  | {
      kind: "surveillance";
      /** Still frame or clip poster (remote URL or under `/mission1/...`). */
      assetUrl?: string;
      zoneLabel: string;
      captureNote?: string;
    }
  | {
      kind: "social";
      handle: string;
      displayName: string;
      postedAgo: string;
      text: string;
      metrics: { reposts: string; replies: string; saves: string };
    };

export type Artifact = {
  id: string;
  title: string;
  type: ArtifactType;
  description: string;
  metadata: Record<string, string>;
  content: ArtifactContent;
  isSynthetic: boolean;
  tellType: TellType;
  explanation: string;
  anomalyHints: string[];
};

export type MissionBrief = {
  missionCode: string;
  title: string;
  handlerIntro: string;
  objective: string;
  classifiedLine: string;
  campaignObjectiveReveal: string;
};
