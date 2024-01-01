import React, { useState, ChangeEvent, FormEvent } from 'react';



const SubscribeForm = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  const FORM_URL = `https://app.convertkit.com/forms/6016671/subscriptions`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.target as HTMLFormElement);

    try {
      const response = await fetch(FORM_URL, {
        method: "post",
        body: data,
        headers: {
          accept: "application/json"
        }
      });
      const json = await response.json();

      if (json.status === "success") {
        setStatus("SUCCESS");
        return;
      }
    } catch (err) {
      setStatus("ERROR");
      console.log(err);
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEmail(value);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setName(value);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      {status === "SUCCESS" && (
        <>
          <p style={{ fontSize: '16px', color: '#333' }}>
            Welcome aboard{name ? `, ${name}` : ""}{" "}
            <span role="img" aria-label="hi">
            👋🏻
            </span>
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>Please check your inbox to confirm the subscription! 📬</p>
          </>
          )}
          {status === "ERROR" && (
          <>
            <p style={{ fontSize: '16px', color: '#333' }}>Oops, something went wrong... 🚫</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Please,{" "}
              <button onClick={() => setStatus(null)} style={{ backgroundColor: '#007bff', color: '#fff', padding: '10px 20px', borderRadius: '4px', border: 'none' }}>try again.</button>
            </p>
        </>
      )}
      {status === null && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
          <input
            style={{ marginBottom: '10px', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
            aria-label="type your name"
            name="fields[name]"
            placeholder="type your name..."
            type="text"
            onChange={handleNameChange}
            value={name}
          />
          <input
            style={{ marginBottom: '10px', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
            aria-label="type your email address"
            name="email_address"
            placeholder="type your email address..."
            required
            type="email"
            onChange={handleEmailChange}
            value={email}
          />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={{ backgroundColor: '#007bff', color: '#fff', padding: '10px 20px', borderRadius: '4px', border: 'none', alignItems: 'center' }}>SUBSCRIBE</button>
            </div>
          </form>
      )}
    </div>
  );
};

export default SubscribeForm;