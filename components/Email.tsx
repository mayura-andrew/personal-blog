import styled from 'styled-components';
import React, { useState, ChangeEvent, FormEvent } from 'react';
import jsonp from 'jsonp';



const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: none;
  border-radius: 5px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;
const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007BFF;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;
const Message = styled.p`
  text-align: center;
  color: #3498db; // green color for success messages
  padding: 10px;
  border: 1px solid #4CAF50;
  border-radius: 5px;
  margin: 20px auto;
  max-width: 400px;
  font-size: 1.2em;
`;

const Spinner = styled.div`
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmailSubscription = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const url = process.env.EMAIL_URL;
    console.log(url);
    jsonp(`${url}&EMAIL=${email}`, { param: 'c' }, (err, data) => {
      console.log('API response:', data); // log the API response
      setIsLoading(false);
      setIsSubscribed(true);
      console.log('isSubscribed set to true'); // log when isSubscribed is set to true
      if (err) {
        console.error(err);
      } else if (data.result !== 'success') {
        console.error(data.msg);
      } else {
        console.log('isSubscribed set to true'); // log when isSubscribed is set to true
      }
    });
  };
  return (
    isSubscribed ? (
      <Message>🎉 Your email has been successfully subscribed! Stay tuned for exciting updates. 😊</Message>
    ) : (
      <Form onSubmit={handleSubmit}>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        {isLoading ? <Spinner /> : <Button type="submit">Subscribe</Button>}      </Form>
    )
  );
};

export default EmailSubscription;
