export type FirebaseConfig = {
  serviceAccount: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  // Web API key (công khai), chỉ dùng để đổi refresh token qua Secure Token API.
  webApiKey: string;
};
