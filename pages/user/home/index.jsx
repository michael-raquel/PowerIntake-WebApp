export default function UserHome({ user, token }) {
  console.log(token);
  async function callExternalApi() {
    const res = await fetch("https://your-api.com/endpoint", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log(data);
  }

  return (
    <div>
      <h1>Welcome, {user?.userDetails}</h1>
      <h1>Token: {token}</h1>
      <button onClick={callExternalApi}>Call API</button>
    </div>
  );
}
