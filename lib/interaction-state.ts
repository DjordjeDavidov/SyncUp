export type InteractionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialInteractionState: InteractionState = {
  status: "idle",
  message: "",
};
