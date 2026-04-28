import React from "react";
import "./About.css";
const About = () => {
  return (
    <div className="page">
      <header className="header">
        <h1>About Us</h1>
      </header>

      <main className="content">
        <section className="about">
          <h2>Who We Are</h2>
          <p>
            The Ministry of Innovation and Technology (MiNT) was formed in 2019 
            by merging the Ministry of Science and Technology and the Ministry 
            of Communication and Information Technology.
          </p>
          <p>
            Our mission is to drive research, innovation, technology transfer, 
            and digital transformation in Ethiopia.
          </p>
        </section>

        <section className="focus">
          <h2>Focus Areas</h2>
          <ul>
            <li>Research</li>
            <li>Innovation</li>
            <li>Technology Transfer</li>
            <li>Digitalization</li>
          </ul>
        </section>
      </main>

    
    </div>
  );
};

export default About;

