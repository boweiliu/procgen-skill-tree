import { Entity } from "../library/entity";
import { IGameState } from "Library";

export interface Interactor {
  isInteractor: true;
  interact(state: IGameState): void;
}

export const IsInteractor = (x: Entity | Entity & Interactor): x is Entity & Interactor => {
  return 'isInteractor' in x && x.isInteractor === true;
};

export const GetInteractors = (s: IGameState) => {
  const entities = s.entities.values();
  const result: (Interactor & Entity)[] = entities.filter(e => IsInteractor(e)) as (Entity & Interactor)[];

  return result;
};