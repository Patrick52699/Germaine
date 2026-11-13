import { useState, useEffect } from "react";

function App() {
    const [user, setUsers] = useState([]);

    useEffect(() => {
        async function getMovies() {
            const apiusergetall = "https://jsonplaceholder.typicode.com/users";
            console.log(apiusergetall);

            try {
                const response = await fetch(apiusergetall);
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.log(err);
            }
        }

        getMovies();
    }, []);

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    {user.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3">{item.name}</td>
                            <td className="border border-gray-300 p-3">{item.username}</td>
                            <td className="border border-gray-300 p-3">{item.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

export default App;