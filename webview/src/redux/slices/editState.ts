import { createSlice } from "@reduxjs/toolkit";
export const editStateSlice = createSlice({
  name: "editState",
  initialState: { codeToEdit: [] as any[] },
  reducers: {},
});
export default editStateSlice.reducer;
