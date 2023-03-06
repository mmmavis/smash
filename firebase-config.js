var generateFirebaseConfig = function(apiKey, tableName) {
  return {
    CONFIG: {
      apiKey: apiKey,
      authDomain: tableName + ".firebaseapp.com",
      databaseURL: "https://mavis-sites-for-mofos.firebaseio.com",
      projectId: "mavis-sites-for-mofos",
      storageBucket: "mavis-sites-for-mofos.appspot.com"
    },
    DB_PATH: "/" + tableName + "/notes"
  };
};
