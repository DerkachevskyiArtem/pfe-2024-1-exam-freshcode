export const getContests = decorateAsyncThunk({
  key: `${CONTESTS_SLICE_NAME}/getContests`,
  thunk: async ({ requestData, role, userId }) => {
    const requestParams = { ...requestData, userId };  // Додаємо userId до параметрів запиту
    const { data } =
      role === CONSTANTS.CUSTOMER
        ? await restController.getCustomersContests(requestParams)
        : await restController.getActiveContests(requestParams);
    return data;
  },
});