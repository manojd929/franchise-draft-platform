export class TournamentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentServiceError";
  }
}
