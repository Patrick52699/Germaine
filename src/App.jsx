
import { useState, useEffect } from "react";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function getUsers() {
      const apiusergetall =
        "https://jsonplaceholder.typicode.com/users";

      try {
        const response = await fetch(apiusergetall);
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.log(err);
      }
    }

    getUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-6">

        <h1 className="text-2xl font-bold text-blue-700 mb-2">
          User Management
        </h1>

        <p className="text-gray-500 mb-6">
          List of all registered users
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">

            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border p-3">No</th>
                <th className="border p-3">Name</th>
                <th className="border p-3">Username</th>
                <th className="border p-3">Email</th>
              </tr>
            </thead>

            <tbody>
              {users.map((item, index) => (
                <tr
                  key={item.id}
                  className="text-center hover:bg-blue-50"
                >
                  <td className="border p-3">{index + 1}</td>
                  <td className="border p-3">{item.name}</td>
                  <td className="border p-3">{item.username}</td>
                  <td className="border p-3 text-blue-600">
                    {item.email}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}

export default App;
