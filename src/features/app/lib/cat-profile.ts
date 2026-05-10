export type CatGender = "male" | "female" | "neutered_male" | "neutered_female";

export type CatSex = "female" | "male";

export function mapCatGenderToSex(gender: CatGender): CatSex {
  switch (gender) {
    case "male":
    case "neutered_male":
      return "male";
    case "female":
    case "neutered_female":
      return "female";
  }
}
