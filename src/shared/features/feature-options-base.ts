export enum RelationType {
  Before = "before",
  After = "after",
  Start = "start",
  End = "end",
}

export class FeatureRelation {
  selector: string = "#center-content";
  type: RelationType = RelationType.Start;

  constructor(selector: string = "#center-content", type: RelationType = RelationType.Start) {
    this.selector = selector;
    this.type = type;
  }
}

export class FeatureOptions {
  featureId: string = "feature";
}

export class InsertedFeatureOptions extends FeatureOptions {
  featurePlacement: FeatureRelation = new FeatureRelation();

  constructor(featureId?: string, featurePlacement?: FeatureRelation) {
    super();
    this.featureId = featureId ?? "inserted-feature";
    this.featurePlacement = featurePlacement ?? new FeatureRelation();
  }

  public insertFeature(container: HTMLElement, feature: HTMLElement): boolean {
    if (!container) {
      return false;
    }
    const relation = container.querySelector(this.featurePlacement.selector) as HTMLElement;
    if (relation) {
      switch (this.featurePlacement.type) {
        case RelationType.Before:
          relation.before(feature);
          return true;
        case RelationType.After:
          relation.after(feature);
          return true;
        case RelationType.Start:
          relation.prepend(feature);
          return true;
        case RelationType.End:
          relation.append(feature);
          return true;
        default:
          return false;
      }
    }

    return false;
  }
}
