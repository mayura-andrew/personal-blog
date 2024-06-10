---
title: Building a Bulk Email Sending API client with Go, Google SMTP, PostgreSQL and Docker 🐳
date: 2024/6/09
description: Discover how to build a robust and scalable bulk email sending API using Go and Google SMTP for the Sustainable Education Foundation's ScholarX platform. This guide covers the architecture, implementation details, concurrency handling, tracking features, and Dockerization. Dive in to learn how to efficiently manage bulk email operations and enhance your projects.
tag: go, api, postgresql, docker, google, smtp, http, restful
author: mayura andrew
---

# Building a Bulk Email Sending API client with Go, Google SMTP, PostgreSQL and Docker

---

### Introduction

In this article, I will guide you through the process of building a bulk email sending API client using Go programing language and Google SMTP. This project is part of the [Sustainable Education Foundation](https://sefglobal.org/)'s [ScholarX](https://scholarx.sefglobal.org/) platform, which aims to deliver free, premium mentoring assistance to elite undergraduate students in Sri Lanka through the support of Sri Lankan expatriates currently involved with some of the world's most renowned universities or Fortune 500 companies. To learn more about this initiative, click [here](https://handbook.sefglobal.org/about).

The ScholarX platform is managed via a React + TypeScript-based frontend and a Node.js + TypeScript-based backend. This article covers the architecture of the email client, reasons for choosing Go, database implementation, tracking features, handling concurrency, and finally, Dockerization. Let's dive in! 🚀

### Tables of Content 📑

- [00 Overview of the Architecture](#00-overview-of-the-architecuture-️)
- [01 Why Go Lang?](#01-why-go-lang-)
- [02 Project Structure](#02-project-structure-)
- [03 Handling Concurrent Emails Sending](#03-handling-concurrent-email-sending-)
- [04 Database Implementation](#04-database-implementation)
- [05 Tracking Feature](#05-tracking-feature-)
- [06 Dockerization of the API](#06-dockerization-of-the-email-client-api)
- [07 Limitations and Security Considerations](#07-limitations-and-security-considerations)
- [08 Conclusion](#08-conclusion-)
- [09 Leaning Resources](#09-learning-resources)
  
### 00 Overview of the Architecuture ⚙️

Let's talk about the overall architecture of this API.

The ScholarX platform and the email client API are structured as follows:

- Front End: A React-based web application where the admin can fetch specific email addresses and compose email messages.
- Backend API: A Node.js and TypeScript-based backend that handles user data and provides endpoints for fetching email addresses.
- Email Sending Client API: A standalone Go application that handles the actual sending of emails using Google SMTP.

![Email Client](public/images/emailapi.svg)
Figure 0: Overview of the API

#### High-Level Workflow:
1. The administrator logs into the React application (admin dashboard).
2. The admin fetches email addresses from the Node.js backend.
3. The admin composes an email and submits it.
4. The Go-based email API processes the request and sends the emails via Google SMTP.
5. The admin can view the results of the sent emails.

This architecture ensures a clear separation of concerns and leverages the strengths of each technology to build a robust and efficient email sending solution.

### 01 Why Go Lang 🐹?

![GoLang](public/images/go.jpeg)
Image source : https://github.com/golang/go
#### Performance 🚀
Go is renowned for its performance, especially in tasks involving high concurrency. This is crucial for sending bulk emails, as it requires the ability to handle many simultaneous network connections efficiently.

#### Concurrency ⚙️
Go's built-in support for concurrency with goroutines makes it an ideal choice for handling multiple email-sending operations concurrently. This ensures timely delivery without overwhelming system resources.

#### Simplicity and Efficiency ⚡
Go's syntax is simple, and its compiled nature ensures that the code runs efficiently. This balance of simplicity and performance makes Go a great choice for building APIs that require both speed and reliability.

For more information about Go, you can refer the offical Go documentation.

### 02 Project Structure 📁

Let's delve into the project structure of our email client API. This structure ensures that our codebase is organized, maintainable and scalable.

![Project Structure](public/images/project-structure.svg)

#### Directory Breakdown

```cmd/api```

This directory contains the main application code for our API:

- ```errors.go``` # Custome error handling
- ```healthcheck.go``` # Health check endpoint.
- ```helpers.go``` # Utility functions.
- ```index.go``` # Entry point for API endpoints.
- ```mail.go``` # Email sending logic.
- ```main.go``` # Main entry point of the application.
- ```middleware.go``` # Middleware functions for request handling.
- ```routes.go``` # API route definitions.
- ```server.go``` # Server setup and configuration.

##### Root Directory

- ```Dockerfile``` # Docker configuration for containerizing the application.
- ```go.mod``` # Go module dependencies.
- ```go.sum``` # Dependency checksum file.
- ```makefile``` # Makefile for build automation.
- ```README.md``` # Project documentation.


##### Internal Directory

This directory contains internal packages that are not meant to be used by external code:

```data``` # Database-related code.

- ```customtype.go``` # Custom data types.
- ```emails.go``` # Email-related database operations.
- ```models.go``` # Data models.

```jsonlog``` # JSON logging utilities.
- ```jsonlog.go``` # JSON logger implementation.

```mailer``` # Email-related logic.
- ```email_template.tmpl``` # Email template file.
- ```mailer.go``` # Email sending functions.

```validator``` # Data validation utilities.
- ```validator.go``` # Validator implementation.

```vcs``` # Version control system integration.
- ```vcs.go``` # VCS-related operations.

```migrations``` # Database migration scripts 
- ```000001_create_emails_table.down.sql``` # Script to drop the emails table.
- ```000001_create_emails_table.up.sql``` # Script to create the emails table.

```remote``` # Configuration files for deployment
- ```production``` # Production-specific configuration.
- ```Caddyfile``` # Configuration for the Caddy web server.
- ```emailapi.service``` # Systemd service file for the email API.

This organized structure helps maintain a clean and manageable codebase, facilitating development, testing, and development.

### 03 Handling Concurrent Email Sending 📬

In this email sending API, handling concurrent email dispatch is a critical component to ensure timely delivery and efficient resource usage. In this section, I'll explain how concurrency is managed in the Go application, ensuring that multiple emails are sent simultaneously without overwhelming in the Go application, ensuring that mutiple emails are sent simultaneously without overwhelming the system.

Go Code Implementation

```go
func NewMail(e data.EmailModel, host string, port int, username, password, sender, subject string, recipients []string, body string) (map[string]*EmailStatus, error) {

	d := mail.NewDialer(host, port, username, password)

	emailStatus := make(map[string]*EmailStatus)

	var statusMutex sync.Mutex

	queue := make(chan string)

	var wg sync.WaitGroup

	email := &data.Email{
		Sender:  sender,
		Body:    body,
		Subject: subject,
	}

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for recipient := range queue {

				tmpl, err := template.ParseFiles("./internal/mailer/email_template.tmpl")
				
				if err != nil {
					log.Println(err)
					continue
				}
				url:= os.Getenv("URL")
				fmt.Println("URL: ", url)

				emailId, err := e.InsertEmail(email, recipient)
				if err != nil {
					log.Println(err)
					return
				}

				data := EmailData{
					Subject:   subject,
					Body:      body,
					Recipient: recipient,
					EmailId: emailId,
					URL: url,
				}

				bodyBuf := new(bytes.Buffer)
				err = tmpl.ExecuteTemplate(bodyBuf, "htmlBody", data)

				if err != nil {
					log.Println(err)				
					continue
				}

				m := mail.NewMessage()
				m.SetHeader("From", sender)
				m.SetHeader("To", recipient)
				m.SetHeader("Subject", subject)
				m.SetBody("text/html", bodyBuf.String()) 

				err = d.DialAndSend(m)

				if err != nil {
					fmt.Println("Failed to send test email to -> " + recipient + ": " + err.Error())
				} else {
					fmt.Println("Sent test email successfully to -> " + recipient)
					statusMutex.Lock()
					emailStatus[recipient].Sent = true
					statusMutex.Unlock()
					err := e.UpdateEmailStatus(emailId)
					if err != nil {
						log.Println(err)
						return
					}
				}
			}
		}()
	}

	for _, recipient := range recipients {
		queue <- recipient

		statusMutex.Lock()
		emailStatus[recipient] = &EmailStatus{
			Sent:     false,
			Opened:   false,
			SentTime: time.Now(),
		}

		statusMutex.Unlock()
	}
	close(queue)

	wg.Wait()

	for recipient, status := range emailStatus {
		log.Printf("Email to %s: sent=%v, opened=%v, sentTime=%v", recipient, status.Sent, status.Opened, status.SentTime)
	}

	return emailStatus, nil
}
```

#### Explanation of Concurrent Handling

1. Dialer Initialization
First, the SMTP dialer is initialized using the provided SMTP server details.
```go
d := mail.NewDialer(host, port, username, password)
```

2. Data Structures for Status Tracking
A map ```emailStatus``` is created to keep track of the status of each email. A mutex ```statusMutex``` is used to ensure safe concurrent access to this map.
```go
emailStatus := make(map[string]*EmailStatus)
var statusMutex sync.Mutex
```
3. Email Queue Channel
A channel ```queue``` is created to manage the list of recipients whose emails need to be sent.
```go
queue := make(chan string)
```
4. Goroutine Pool
A pool of 10 goroutines is created to process the email queue concurrently. Each goroutine fetches a recipient from the queue, composes the email, and sends it using the SMTP dialer.
```go
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for recipient := range queue {
            // Email sending logic
        }
    }()
}

```
5. Queueing Recipients
Each recipient is added to the queue, and an initial status is recorded in the ```emailStatus``` map.
```go
for _, recipient := range recipients {
    queue <- recipient
    statusMutex.Lock()
    emailStatuses[recipient] = &EmailStatus{
        Sent:     false,
        Opened:   false,
        SentTime: time.Now(),
    }
    statusMutex.Unlock()
}
close(queue)
```
6. Waiting for Goroutines to Finish
The ```WaitGroup``` ensures that the main function waits for all goroutines to finish processing before proceeding.
```go
wg.Wait()
```
7. Logging Email Statues
After all emails have been processed, the status are logged.
```go
for recipient, status := range emailStatuses {
    log.Printf("Email to %s: sent=%v, opened=%v, sentTime=%v", recipient, status.Sent, status.Opened, status.SentTime)
}
```
By leveraging Go's goroutines and channels, the email sending API efficiently handles concurrent email dispatch. This approach ensures that emails are sent promptly without overwhelming the system, providing a robust solution for large-scale email campaigns. The use of syschronization mechanisms like ```sync.Mutex``` and ```sync.WaitGroup``` ensures that data intergrity is maintained throughout the process.

### 04 Database Implementation 

In this section, we'll look at the database setup and how our Go API interacts with it to manaage emails and recipients. The database schema has two mail tables. ```emails``` and ```recipients```. Let's talks about their structure and the functions used for database operations.

#### Database Schema

Here's the SQL schema for our PostgreSQL database.

```sql
CREATE TABLE emails (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sender VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    subject VARCHAR(255) NOT NULL
);

CREATE TABLE recipients (
    id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES emails(id),
    recipient VARCHAR(255) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    sent_time TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    opened BOOLEAN NOT NULL DEFAULT FALSE,
    opened_time TIMESTAMP WITH TIME ZONE
);
```
#### Explaination 

- ```emails``` Table: Stores details about each email, such as the sender, body, subject, and the time it was created.

- ```recipients``` Table: Stores details about each recipient, including the email ID (as a foreign key), recipient's email address, whether the email was sent, sent time, whether it was opened, and the opened time.

#### Insert and Update Go Functions

We have two key functions for interacting with the database.
- one for inserting new emails and recipients.
- another for updating the status of sent emails.

##### Insert Email Function

The ```InsertEmail``` function inserts a new email into the ```emails``` table and then inserts the recipient information into the ```recipients``` table.

```go
func (e EmailModel) InsertEmail(email *Email, recipient string) (int64, error) {
    query := `INSERT INTO emails (sender, body, subject) VALUES ($1, $2, $3) RETURNING id, created_at`
    args := []any{email.Sender, email.Body, email.Subject}

    err := e.DB.QueryRow(query, args...).Scan(&email.ID, &email.CreatedAt)
    if err != nil {
        return 0, err
    }

    emailID, err := e.InsertEmailRecipient(email, recipient)
    if err != nil {
        log.Println(err)
    }

    return emailID, nil
}

func (e EmailModel) InsertEmailRecipient(email *Email, recipient string) (int64, error) {
    query := `INSERT INTO recipients (email_id, recipient, status, sent_time, opened) VALUES ($1, $2, $3, $4, $5) RETURNING id`
    args := []any{email.ID, recipient, false, time.Now(), false}

    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    var id int64
    err := e.DB.QueryRowContext(ctx, query, args...).Scan(&id)
    if err != nil {
        return 0, err
    }

    return id, nil
}
```
##### Update Email Status Function

The ```UpdateEmailStatus``` function updates the status of a sent email in the ```recipients``` table.

```go
func (e EmailModel) UpdateEmailStatus(id int64) error {
    query := `UPDATE recipients SET status = true, sent_time = $1 WHERE id = $2`
    args := []any{time.Now(), id}

    _, err := e.DB.Exec(query, args...)
    return err
}
```

##### Intergrating with Concurrent Email Sending

The ```NewMail``` function is responsible for handling the concurrent sending of emails. It uses the ```InsertEmail``` function to insert email and recipient records concurrently.

```go
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for recipient := range queue {
            tmpl, err := template.ParseFiles("./internal/mailer/email_template.tmpl")
            if err != nil {
                log.Println(err)
                continue
            }

            url := os.Getenv("URL")
            fmt.Println("URL: ", url)

            emailId, err := e.InsertEmail(email, recipient)
            if err != nil {
                log.Println(err)
                return
            }

            // Email sending logic
            bodyBuf := new(bytes.Buffer)
            err = tmpl.ExecuteTemplate(bodyBuf, "htmlBody", data)
            if err != nil {
                log.Println(err)
                continue
            }

            m := mail.NewMessage()
            m.SetHeader("From", sender)
            m.SetHeader("To", recipient)
            m.SetHeader("Subject", subject)
            m.SetBody("text/html", bodyBuf.String())

            err = d.DialAndSend(m)
            if err != nil {
                fmt.Println("Failed to send email to -> " + recipient + ": " + err.Error())
            } else {
                fmt.Println("Sent email successfully to -> " + recipient)
                statusMutex.Lock()
                emailStatuses[recipient].Sent = true
                statusMutex.Unlock()
                err := e.UpdateEmailStatus(emailId)
                if err != nil {
                    log.Println(err)
                    return
                }
            }
        }
    }()
}

for _, recipient := range recipients {
    queue <- recipient
    statusMutex.Lock()
    emailStatuses[recipient] = &EmailStatus{
        Sent:     false,
        Opened:   false,
        SentTime: time.Now(),
    }
    statusMutex.Unlock()
}
close(queue)
wg.Wait()

```

- Goroutine Pool: We create a pool of 10 goroutines to process the email queue concurrently, calling InsertEmail to insert email and recipient records.
- Queue Processing: Each recipient is added to the queue, and their initial status is recorded in the emailStatuses map.
- Status Update: After sending the email, the status of each recipient is updated in the database using the UpdateEmailStatus function.


This approach ensures that emails are sent efficiently and concurrently while keeping track of each email's status in the database. By using goroutines and channels, we achieve high concurrency, making the system scalable and responsive.

### 05 Tracking Feature 📧

To monitor whether recipients open the emails sent through our API, we can implement a simple tracking mechanism using a unique link embedded in each email. When the recipient clicks this link, it will trigger our API to update the database, indicating that the email has been opened.

![Tracking Email](public/images/trackemail.svg)

#### Setting Up the Tracking API Endpoint
First, we need to define an API endpoint that will handle the tracking. This endpoint will be responsible for updating the ```recipients``` table to mark the email as opened.

```go
router.HandlerFunc(http.MethodGet, "/api/v1/redirect", app.track)
```
This endpoint uses the HTTP GET method and points to the ```track``` handler function.

##### Implementing the Tracking Handler

The ```track``` handler function retrieves the email ID from the request, logs the event, updates the databasem and then redirects the user to the ```example``` Dashboard.

```go
func (app *application) track(w http.ResponseWriter, r *http.Request) {
    id, err := app.readIDParam(r)
    fmt.Println(id)
    if err != nil {
        app.writeJSON(w, http.StatusBadRequest, envelope{"status": map[string]string{"error": "Missing id parameter"}}, nil)
        return
    }
    
    log.Printf("Email opened: %d", id)
    
    err = mailer.UpdateEmailTracking(app.models.Emails, id)
    if err != nil {
        log.Printf("Failed to update email tracking: %v", err)
        app.writeJSON(w, http.StatusInternalServerError, envelope{"status": map[string]string{"error": "Internal server error"}}, nil)
        return
    }
    
    redirectURL := "https://example.com"
    http.Redirect(w, r, redirectURL, http.StatusFound)
}
```
##### Explanation

- ```readIDParam```: This function extracts the email ID from the request.
- Logging: The event is logged for debugging purposes.
- Update Tracking: The UpdateEmailTracking function is called to update the database.
- Redirect: Finally, the user is redirected to the example dashboard/website.

##### Database Update Function

To update the email tracking status in the database, we define the ```UpdateEmailTracking``` function, which calls the ```UpdateEmail``` method of the ```EmailModel```.

```go
func UpdateEmailTracking(e data.EmailModel, emailid int64) error {
    return e.UpdateEmail(emailid)
}
```
```go
func (e EmailModel) UpdateEmail(id int64) error {
    query := `UPDATE recipients SET opened = true, opened_time = $1 WHERE id = $2`
    args := []any{time.Now(), id}

    _, err := e.DB.Exec(query, args...)
    return err
}
```
##### Explanation

- SQL Query: The SQL query updates the ```opened``` status and ```opened_time``` in the ```recipients``` table.
- Execution: The query is executed with the current time and the provided email ID.

##### Complete Email Sending  Process
To integrate tracking into the email sending process, each email should include a unique link to the tracking endpoint. This link should contain the email ID as a query parameter.

Here is how the data is embedded into the Go template file during the email sending process.

```go
tmpl, err := template.ParseFiles("./internal/mailer/email_template.tmpl")
if err != nil {
    log.Println(err)
    continue
}

url := os.Getenv("URL")
fmt.Println("URL: ", url)

emailId, err := e.InsertEmail(email, recipient)
if err != nil {
    log.Println(err)
    return
}

data := EmailData{
    Subject:   subject,
    Body:      body,
    Recipient: recipient,
    EmailId:   emailId,
    URL:       url,
}

bodyBuf := new(bytes.Buffer)
err = tmpl.ExecuteTemplate(bodyBuf, "htmlBody", data)
if err != nil {
    log.Println(err)                
    continue
}
```
##### Explanation

- Template Parsing: The email template is parsed from the specified file.
- URL Fetching: The URL for the tracking endpoint is fetched from the environment variables.
- Email Insertion: The ```InsertEmail``` function inserts the email and recipient into the database and returns the email ID.
- Data Preparation: The ```EmailData``` struct is populated with the necessary details, including the tracking URL and email ID.
- Template Execution: The template is executed with the populated data, and the resulting HTML content is stored in ```bodyBuf```.

##### Email Template Example 

```html
<a href="{{.URL}}/api/v1/redirect?id={{.EmailId}}">Access Your Example Dashboard/Website</a>
```
By embedding this link in the email template, we ensure that every time a recipient clicks on the link, our tracking endpoint is triggered, and the database in updated accordingly.

### 06 Dockerization of the Email Client API
Dockerizing our Go-based email sending API brings several benefits, including consistency across different environment, ease of deployment, and simplified dependency management. Here's a detailed guide on how to Dockerize the API.

#### Benefits of Dockerization

- Consistency: Docker ensures that the application runs the same way on different environments by packaging the application and its dependencies together.
- Isolation: Each Docker container runs in its own isolated environment, preventing conflicts with other applications.
- Scalability: Docker makes it easy to scale applications horizontally by running multiple instances of a containerized application.
- Portability: Docker containers can run on any system that supports Docker, providing a high level of portability.

##### Dockerfile for the API
To Dockerize the Go email sending client API, we create a Dockerfile that specifies how to build andd run the application inside a Docker container.

```bash
# Use the official Go image as the base image
FROM golang:alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum files to the working directory
COPY go.mod go.sum ./

# Download the Go module dependencies
RUN go mod download

# Copy the source code to the working directory
COPY . .

# Build the Go application
RUN go build -o app ./cmd/api

# Expose the port on which the application will run
EXPOSE 4000

# Set environment variables for the application
ENV DB_DSN= \
    SMTPPORT= \
    SMTPSENDER= \
    SMTPHOST= \
    SMTPUSERNAME= \
    SMTPPASS= \
    URL=

# Command to run the application
CMD ["./app"]
```
##### Explanation of the Dockerfile

1. Base Image: We use the official golang:alpine image, which is a minimal Docker image with Go installed.
Working Directory: We set /app as the working directory inside the container.
2. Dependency Management: We copy go.mod and go.sum files and run go mod download to download the dependencies.
3. Copying Source Code: We copy the entire source code into the container.
4. Building the Application: We build the Go application, producing an executable named app.
5. Port Exposure: We expose port 4000, which the application will listen on.
6. Environment Variables: We set environment variables for the database DSN, SMTP configuration, and URL. These should be provided when running the container.
7. Running the Application: We specify the command to run the built application.

##### Building and Running the Docker Container
To build and run the Docker container, follow these steps.

1. Build the Docker Image
```bash
docker build -t email-client-api .
```
2. Run the Docker Container
```bash
docker run -d -p 4000:4000 --env-file .env email-client-api
```
In this command:

- ```-d```: Runs the container in detached mode.
- ```-p 4000:4000```: Maps port 4000 of the container to port 4000 on the host.
- ```--env-file .env```: Specifies a file containing environment variables.
Ensure that the ```.env``` file contains the necessary environment variables:

```bash
DB_DSN=your_database_dsn
SMTPPORT=your_smtp_port
SMTPSENDER=your_smtp_sender
SMTPHOST=your_smtp_host
SMTPUSERNAME=your_smtp_username
SMTPPASS=your_smtp_password
URL=your_tracking_url
```
Now it is running...

### 07 Limitations and Security Considerations🔒

While this email client API is robust and efficient, it is essential to acknowledge some limitations and future security improvements.

##### Limitations of Googel SMTP

- Email Sending Limits: Google SMTP has a daily sending limit. Exceeding these limits will result in temporarily losing the ability to send emails.
- More about Google SMTP read [this](https://support.google.com/a/answer/176600?hl=en)

##### Security Considerations
- Authentication and Authorization: Currently, the API does not implement authentication or authorization mechanisms. This poses a security risk as unauthorized users could potentially send emails or access sensitive endpoints. Implementing robust authentication (such as OAuth2 or JWT) and role-based access control will be essential to secure the API.
- Rate Limiting: To prevent abuse and ensure fair usage, a rate limiter has been implemented. This middleware restricts the number of requests each client can make within a specified time frame, helping to mitigate DoS attacks. 
Here is the implementation:

```go
func (app *application) rateLimit(next http.Handler) http.Handler {
	type client struct {
		limiter  *rate.Limiter
		lastSeen time.Time
	}

	var (
		mu      sync.Mutex
		clients = make(map[string]*client)
	)

	go func() {
		for {
			time.Sleep(time.Minute)

			mu.Lock()
			for ip, client := range clients {
				if time.Since(client.lastSeen) > 3*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if app.config.limiter.enabled {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				app.serverErrorResponse(w, r, err)
				return
			}

			mu.Lock()
			if _, found := clients[ip]; !found {
				clients[ip] = &client{
					limiter: rate.NewLimiter(rate.Limit(app.config.limiter.rps), app.config.limiter.burst),
				}
			}

			clients[ip].lastSeen = time.Now()

			if !clients[ip].limiter.Allow() {
				mu.Unlock()
				app.rateLimitExceededResponse(w, r)
				return
			}
			mu.Unlock()
		}
		next.ServeHTTP(w, r)
	})
}
```

This middleware ensures that each client can only make a certain number of requests per second, providing a basic form of protection against abuse.

### 08 Conclusion 🌟

In this article, we explored the comprehensive process of building a bulk email sending API using Go and Google SMTP, which is an integral part of the Sustainable Education Foundation's ScholarX platform. We delved into the architecture of the platform, highlighting the seamless interaction between the React-based frontend, Node.js backend, and the Go email client.

We discussed why Go was chosen for this task, emphasizing its performance, concurrency support, simplicity, and efficiency. We then walked through the implementation of the database schema, handling concurrent email sending operations, and tracking email opens using unique links.

Finally, we covered the benefits of Dockerization and provided a step-by-step guide to creating and running a Docker container for the email sending API, ensuring a consistent and reliable deployment process.

By leveraging these technologies and practices, we have created a robust and scalable email sending system that efficiently handles bulk email operations while maintaining high performance and reliability. This approach not only enhances the functionality of the ScholarX platform but also ensures that the communication needs of the Sustainable Education Foundation are met with precision and efficiency.

I hope this guide provides valuable insights and helps you in implementing similar solutions in your projects. Happy coding! 🚀


### 09 Learning Resources📚

For further learning and to explore the code, check out following resources:
- [GitHub Repository📦](https://github.com/sef-global/email-client-api): View the complete source code for this project.
- [DockerHub🐳](https://hub.docker.com/r/mayuraandrew/gosendemailapi): Access the Docker image for easy deployment.
- [Go Programming Language🐹](https://go.dev/): Official Go documentation for deeper insights into Go's capabilities.
- [About Containers🛳️](https://mayuraandrew.tech/posts/containers):  Learn more about the containers.
- [ScholarX Platform🎓](https://scholarx.sefglobal.org/): Explore the ScholarX platform and its mission to provide premium mentoring assistance.
- [Sustainable Education Foundation🌍](https://sefglobal.org/):Learn more about the foundation and its initiatives.
  
##### Your contributions and feedback are welcome!😃 Feel free to fork the repository, submit pull requests, or report issues. Let's collaborate🫂 to make this project event better. Thank you for reading!
---
