package com.careerready.service;

import com.careerready.entity.Company;
import com.careerready.entity.CompanySkill;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.Question;
import com.careerready.entity.Skill;
import com.careerready.entity.Student;
import com.careerready.entity.StudentSkill;
import com.careerready.entity.User;
import com.careerready.enums.AssessmentType;
import com.careerready.enums.DifficultyLevel;
import com.careerready.enums.Role;
import com.careerready.enums.SkillLevel;
import com.careerready.enums.UserStatus;
import com.careerready.repository.CompanyRepository;
import com.careerready.repository.CompanySkillRepository;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.PlacementHodRepository;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.QuestionRepository;
import com.careerready.repository.SkillRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.repository.UserRepository;
import com.careerready.entity.CmsContent;
import com.careerready.entity.GlobalSetting;
import com.careerready.enums.ContentType;
import com.careerready.repository.CmsContentRepository;
import com.careerready.repository.GlobalSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializationService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;
    private final PlacementStaffRepository staffRepository;
    private final PlacementHodRepository hodRepository;
    private final CompanyRepository companyRepository;
    private final SkillRepository skillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final CompanySkillRepository companySkillRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;
    private final PredictionService predictionService;
    private final CmsContentRepository cmsContentRepository;
    private final GlobalSettingRepository globalSettingRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedCmsContent();
        ensureAdminAccount();

        if (userRepository.count() > 0 && questionRepository.count() >= 60) {
            log.info("Database already seeded with demo records and questions. Skipping business initialization.");
            return;
        }

        log.info("Starting CareerReady AI initial data seeding...");

        Map<String, Department> deptMap = seedDepartments();
        Map<String, Skill> skillMap = seedSkills();
        seedCompanies(skillMap);
        seedAptitudeQuestions();
        seedTechnicalQuestions();
        seedUsersAndStudents(deptMap, skillMap);

        log.info("CareerReady AI seed data initialized successfully.");
    }

    private Map<String, Department> seedDepartments() {
        Map<String, Department> map = new HashMap<>();
        String[][] depts = {
                {"Computer Science and Engineering", "CSE"},
                {"Information Technology", "IT"},
                {"Electronics and Communication Engineering", "ECE"},
                {"Electrical and Electronics Engineering", "EEE"},
                {"Mechanical Engineering", "MECH"}
        };

        for (String[] d : depts) {
            Department dept = departmentRepository.findByCode(d[1])
                    .orElseGet(() -> departmentRepository.save(Department.builder()
                            .name(d[0])
                            .code(d[1])
                            .status(UserStatus.ACTIVE)
                            .build()));
            map.put(d[1], dept);
        }
        return map;
    }

    private Map<String, Skill> seedSkills() {
        Map<String, Skill> map = new HashMap<>();
        String[][] skills = {
                {"Java", "Programming", "Core Java, Collections, Multithreading, OOP"},
                {"Python", "Programming", "Python fundamentals, Data structures, scripting"},
                {"SQL", "Database", "Relational queries, joins, indexes, normalization"},
                {"DBMS", "Database", "ACID properties, transactions, concurrency control"},
                {"Data Structures", "Core CS", "Arrays, Linked Lists, Trees, Graphs, Hash Maps"},
                {"JavaScript", "Web Development", "ES6+, Async/Await, DOM manipulation, closures"},
                {"React", "Web Development", "Component architecture, Hooks, State management, SPA"},
                {"Spring Boot", "Backend Development", "Dependency Injection, Spring MVC, REST, JPA"},
                {"HTML", "Web Development", "Semantic HTML5, accessibility, structured markup"},
                {"CSS", "Web Development", "CSS3, Flexbox, CSS Grid, Responsive Design"},
                {"Communication", "Soft Skills", "Technical presentation, articulation, collaboration"},
                {"Problem Solving", "Aptitude", "Analytical breakdown, edge case handling, logic"},
                {"Cloud Fundamentals", "DevOps & Cloud", "AWS/Azure primitives, compute, storage, IAM"},
                {"Computer Networks", "Core CS", "TCP/IP, OSI model, HTTP/HTTPS, DNS, Subnets"},
                {"System Design", "Architecture", "Scalability, caching, load balancing, microservices"},
                {"Algorithms", "Core CS", "Sorting, Searching, Dynamic Programming, Greedy approaches"},
                {"Testing", "Quality", "Unit testing, JUnit, Mockito, test coverage"}
        };

        for (String[] s : skills) {
            Skill skill = skillRepository.findByNameIgnoreCase(s[0])
                    .orElseGet(() -> skillRepository.save(Skill.builder()
                            .name(s[0])
                            .category(s[1])
                            .description(s[2])
                            .active(true)
                            .build()));
            map.put(s[0], skill);
        }
        return map;
    }

    private void seedCompanies(Map<String, Skill> skills) {
        if (companyRepository.count() >= 8) return;

        createCompany("TCS", "Tata Consultancy Services - Enterprise digital solutions and global IT consulting.",
                7.0, 60, 65,
                List.of(
                        new ReqSkill(skills.get("Java"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("SQL"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Spring Boot"), SkillLevel.BEGINNER, false),
                        new ReqSkill(skills.get("Data Structures"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Communication"), SkillLevel.INTERMEDIATE, true)
                ));

        createCompany("Infosys", "Infosys Limited - Global leader in next-generation digital services and consulting.",
                7.2, 65, 65,
                List.of(
                        new ReqSkill(skills.get("Java"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Python"), SkillLevel.INTERMEDIATE, false),
                        new ReqSkill(skills.get("SQL"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Data Structures"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Cloud Fundamentals"), SkillLevel.BEGINNER, false)
                ));

        createCompany("Accenture", "Accenture - Global professional services company with leading capabilities in digital and cloud.",
                6.8, 60, 60,
                List.of(
                        new ReqSkill(skills.get("JavaScript"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("SQL"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("React"), SkillLevel.INTERMEDIATE, false),
                        new ReqSkill(skills.get("Problem Solving"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Communication"), SkillLevel.INTERMEDIATE, true)
                ));

        createCompany("Wipro", "Wipro - Leading technology services and consulting company focused on building innovative solutions.",
                6.5, 60, 60,
                List.of(
                        new ReqSkill(skills.get("Java"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("HTML"), SkillLevel.INTERMEDIATE, false),
                        new ReqSkill(skills.get("CSS"), SkillLevel.INTERMEDIATE, false),
                        new ReqSkill(skills.get("SQL"), SkillLevel.BEGINNER, true)
                ));

        createCompany("Cognizant", "Cognizant - Transforming business, operating and technology models for the modern digital era.",
                6.8, 65, 65,
                List.of(
                        new ReqSkill(skills.get("Java"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("SQL"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Data Structures"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Testing"), SkillLevel.BEGINNER, false)
                ));

        createCompany("Cisco Systems", "Cisco - Worldwide leader in networking hardware, software, telecommunications and cybersecurity.",
                8.0, 75, 80,
                List.of(
                        new ReqSkill(skills.get("Computer Networks"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("Python"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Data Structures"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("Algorithms"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("Problem Solving"), SkillLevel.ADVANCED, true)
                ));

        createCompany("Amazon", "Amazon - Multinational technology corporation focusing on cloud computing, digital streaming, and AI.",
                8.5, 80, 85,
                List.of(
                        new ReqSkill(skills.get("Data Structures"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("Algorithms"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("System Design"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Java"), SkillLevel.ADVANCED, true),
                        new ReqSkill(skills.get("Problem Solving"), SkillLevel.ADVANCED, true)
                ));

        createCompany("Capgemini", "Capgemini - Global leader in partnering with companies to transform and manage their business through technology.",
                6.8, 60, 65,
                List.of(
                        new ReqSkill(skills.get("Java"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("Spring Boot"), SkillLevel.BEGINNER, false),
                        new ReqSkill(skills.get("SQL"), SkillLevel.INTERMEDIATE, true),
                        new ReqSkill(skills.get("React"), SkillLevel.BEGINNER, false)
                ));
    }

    private record ReqSkill(Skill skill, SkillLevel level, boolean mandatory) {}

    private void createCompany(String name, String desc, double cgpa, int aptCutoff, int techCutoff, List<ReqSkill> reqSkills) {
        Company company = companyRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .name(name)
                        .description(desc)
                        .requiredCgpa(cgpa)
                        .minimumAptitudeScore((double) aptCutoff)
                        .minimumTechnicalScore((double) techCutoff)
                        .active(true)
                        .build()));

        if (companySkillRepository.findByCompanyId(company.getId()).isEmpty()) {
            List<CompanySkill> csList = new ArrayList<>();
            for (ReqSkill rs : reqSkills) {
                if (rs.skill != null) {
                    csList.add(CompanySkill.builder()
                            .company(company)
                            .skill(rs.skill)
                            .requiredLevel(rs.level)
                            .mandatory(rs.mandatory)
                            .build());
                }
            }
            companySkillRepository.saveAll(csList);
        }
    }

    private void seedAptitudeQuestions() {
        if (questionRepository.findByAssessmentTypeAndActiveTrue(AssessmentType.APTITUDE).size() >= 30) return;

        List<Question> list = new ArrayList<>();

        // Quantitative Aptitude
        list.add(q("A train running at 72 km/h crosses a 250m long platform in 26 seconds. What is the length of the train?",
                "250 m", "270 m", "300 m", "240 m", "B", AssessmentType.APTITUDE, "Time Speed Distance", DifficultyLevel.MEDIUM));
        list.add(q("If 12 men or 18 women can do a work in 14 days, then in how many days will 8 men and 16 women do the same work?",
                "7 days", "9 days", "10 days", "8 days", "B", AssessmentType.APTITUDE, "Time and Work", DifficultyLevel.HARD));
        list.add(q("A shopkeeper marks an article at Rs. 800 and allows a 15% discount. If he still gains 20%, what is the cost price?",
                "Rs. 566.67", "Rs. 600", "Rs. 580", "Rs. 620", "A", AssessmentType.APTITUDE, "Profit and Loss", DifficultyLevel.MEDIUM));
        list.add(q("The average of 5 consecutive odd numbers is 61. What is the difference between the highest and lowest numbers?",
                "8", "6", "10", "12", "A", AssessmentType.APTITUDE, "Averages", DifficultyLevel.EASY));
        list.add(q("Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new numbers are in the ratio 12:23. What is the smaller number?",
                "27", "33", "49", "55", "B", AssessmentType.APTITUDE, "Ratio and Proportion", DifficultyLevel.MEDIUM));
        list.add(q("A bag contains 4 red, 5 green, and 6 blue balls. If two balls are drawn at random, what is the probability that none is red?",
                "11/21", "22/35", "5/14", "33/70", "A", AssessmentType.APTITUDE, "Probability", DifficultyLevel.MEDIUM));
        list.add(q("If the price of sugar increases by 25%, by what percent must consumption be reduced so that expenditure remains unchanged?",
                "15%", "20%", "25%", "30%", "B", AssessmentType.APTITUDE, "Percentages", DifficultyLevel.EASY));
        list.add(q("Find the sum of all natural numbers from 1 to 100.",
                "5000", "5050", "5100", "5025", "B", AssessmentType.APTITUDE, "Number System", DifficultyLevel.EASY));
        list.add(q("In an examination, 35% of candidates fail in Mathematics and 25% fail in English. If 10% fail in both, what percentage passed in both subjects?",
                "50%", "55%", "60%", "65%", "A", AssessmentType.APTITUDE, "Percentages", DifficultyLevel.MEDIUM));
        list.add(q("A sum of money doubles itself at compound interest in 15 years. In how many years will it become 8 times?",
                "30 years", "45 years", "60 years", "40 years", "B", AssessmentType.APTITUDE, "Compound Interest", DifficultyLevel.MEDIUM));

        // Logical Reasoning
        list.add(q("Find the next number in the series: 3, 7, 15, 31, 63, ?",
                "125", "127", "129", "131", "B", AssessmentType.APTITUDE, "Sequences", DifficultyLevel.EASY));
        list.add(q("If 'WATER' is coded as 'YCVGT', how is 'FIRE' coded in that system?",
                "HKTG", "GJSF", "HKUG", "GKTH", "A", AssessmentType.APTITUDE, "Coding-Decoding", DifficultyLevel.EASY));
        list.add(q("Pointing to a photograph, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the person in the photograph?",
                "Sister", "Mother", "Aunt", "Daughter", "B", AssessmentType.APTITUDE, "Blood Relations", DifficultyLevel.MEDIUM));
        list.add(q("Statement: All roses are flowers. Some flowers are red. Conclusion I: Some roses are red. Conclusion II: Some red things are flowers.",
                "Only I follows", "Only II follows", "Both follow", "Neither follows", "B", AssessmentType.APTITUDE, "Syllogisms", DifficultyLevel.MEDIUM));
        list.add(q("A person walks 5 km North, turns right and walks 3 km, turns right again and walks 5 km. How far and in what direction is he from the starting point?",
                "3 km East", "3 km West", "5 km South", "8 km East", "A", AssessmentType.APTITUDE, "Direction Sense", DifficultyLevel.EASY));
        list.add(q("Find the odd one out: 27, 64, 125, 216, 343, 512, 729, 1000",
                "27", "64", "512", "All are cubes", "D", AssessmentType.APTITUDE, "Number Reasoning", DifficultyLevel.EASY));
        list.add(q("In a clock showing 3:15, what is the exact angle between the hour hand and minute hand?",
                "0 degrees", "7.5 degrees", "15 degrees", "12.5 degrees", "B", AssessmentType.APTITUDE, "Clock and Calendar", DifficultyLevel.HARD));
        list.add(q("If January 1, 2024 was a Monday, what day of the week was December 31, 2024?",
                "Monday", "Tuesday", "Wednesday", "Sunday", "B", AssessmentType.APTITUDE, "Clock and Calendar", DifficultyLevel.MEDIUM));
        list.add(q("Five persons A, B, C, D, E are sitting in a row facing North. C is sitting between A and E. B is to the immediate right of E. Who is in the middle?",
                "A", "C", "E", "B", "B", AssessmentType.APTITUDE, "Seating Arrangement", DifficultyLevel.MEDIUM));
        list.add(q("Choose the pair that expresses a relationship similar to 'ARCHITECT : BUILDING' -",
                "Doctor : Patient", "Sculptor : Statue", "Judge : Verdict", "Author : Novel", "B", AssessmentType.APTITUDE, "Analogy", DifficultyLevel.EASY));

        // Verbal Ability
        list.add(q("Choose the correct synonym for 'CANDID':",
                "Deceptive", "Frank", "Reserved", "Shy", "B", AssessmentType.APTITUDE, "Verbal Ability", DifficultyLevel.EASY));
        list.add(q("Choose the antonym for 'METICULOUS':",
                "Careful", "Careless", "Thorough", "Painstaking", "B", AssessmentType.APTITUDE, "Verbal Ability", DifficultyLevel.EASY));
        list.add(q("Fill in the blank: Neither the teacher nor the students ______ present in the auditorium.",
                "was", "were", "is", "has been", "B", AssessmentType.APTITUDE, "Grammar", DifficultyLevel.MEDIUM));
        list.add(q("Identify the correctly spelled word:",
                "Accomodation", "Accommodation", "Acommodation", "Accomadation", "B", AssessmentType.APTITUDE, "Spelling", DifficultyLevel.EASY));
        list.add(q("Choose the meaning of the idiom: 'To spill the beans'",
                "To drop food accidentally", "To reveal a secret", "To waste money", "To create chaos", "B", AssessmentType.APTITUDE, "Idioms and Phrases", DifficultyLevel.EASY));
        list.add(q("Rearrange the parts: P: in the world, Q: of the largest economies, R: India has emerged, S: as one. The correct sequence is:",
                "RQSP", "RSQP", "PQRS", "SQRP", "B", AssessmentType.APTITUDE, "Para Jumbles", DifficultyLevel.MEDIUM));
        list.add(q("Spot the error: 'Each of the boys (A) / have finished (B) / their homework (C) / No error (D)'",
                "A", "B", "C", "D", "B", AssessmentType.APTITUDE, "Spotting Errors", DifficultyLevel.MEDIUM));
        list.add(q("Choose the word that best completes the sentence: The speaker's arguments were so ______ that everyone agreed with his proposal.",
                "lucid", "confusing", "verbose", "superficial", "A", AssessmentType.APTITUDE, "Vocabulary", DifficultyLevel.MEDIUM));
        list.add(q("Select the active voice of: 'The novel was written by Charles Dickens.'",
                "Charles Dickens writes the novel.", "Charles Dickens wrote the novel.", "Charles Dickens has written the novel.", "Charles Dickens had written the novel.", "B", AssessmentType.APTITUDE, "Voice", DifficultyLevel.EASY));
        list.add(q("Choose the one-word substitution for: 'A person who looks on the bright side of things'",
                "Pessimist", "Optimist", "Altruist", "Pacifist", "B", AssessmentType.APTITUDE, "Vocabulary", DifficultyLevel.EASY));

        questionRepository.saveAll(list);
    }

    private void seedTechnicalQuestions() {
        if (questionRepository.findByAssessmentTypeAndActiveTrue(AssessmentType.TECHNICAL).size() >= 30) return;

        List<Question> list = new ArrayList<>();

        // Java & OOP
        list.add(q("Which of the following is NOT a feature of Java?",
                "Object-oriented", "Pointers support", "Platform independent", "Multithreaded", "B", AssessmentType.TECHNICAL, "Java", DifficultyLevel.EASY));
        list.add(q("In Java, which collection class allows null keys and values?",
                "Hashtable", "HashMap", "TreeMap", "ConcurrentHashMap", "B", AssessmentType.TECHNICAL, "Java", DifficultyLevel.EASY));
        list.add(q("What happens when an exception is thrown inside a try block with no matching catch block but a finally block exists?",
                "The finally block is skipped", "The finally block executes before program terminates", "A compilation error occurs", "The program hangs indefinitely", "B", AssessmentType.TECHNICAL, "Java", DifficultyLevel.MEDIUM));
        list.add(q("Which OOP principle is demonstrated by method overloading in Java?",
                "Runtime Polymorphism", "Compile-time Polymorphism", "Encapsulation", "Abstraction", "B", AssessmentType.TECHNICAL, "OOP", DifficultyLevel.EASY));
        list.add(q("What is the time complexity of searching an element in a balanced Binary Search Tree (AVL tree)?",
                "O(1)", "O(n)", "O(log n)", "O(n log n)", "C", AssessmentType.TECHNICAL, "Data Structures", DifficultyLevel.MEDIUM));

        // Data Structures & Algorithms
        list.add(q("Which data structure is primarily used to implement Breadth First Search (BFS) in a graph?",
                "Stack", "Queue", "Priority Queue", "Binary Tree", "B", AssessmentType.TECHNICAL, "Data Structures", DifficultyLevel.EASY));
        list.add(q("What is the worst-case time complexity of QuickSort?",
                "O(n)", "O(n log n)", "O(n^2)", "O(log n)", "C", AssessmentType.TECHNICAL, "Algorithms", DifficultyLevel.MEDIUM));
        list.add(q("Which data structure uses LIFO (Last In First Out) ordering?",
                "Queue", "Stack", "Heap", "Linked List", "B", AssessmentType.TECHNICAL, "Data Structures", DifficultyLevel.EASY));
        list.add(q("What is the auxiliary space complexity of MergeSort?",
                "O(1)", "O(log n)", "O(n)", "O(n^2)", "C", AssessmentType.TECHNICAL, "Algorithms", DifficultyLevel.MEDIUM));
        list.add(q("In a min-heap with n elements, what is the time complexity to extract the minimum element?",
                "O(1)", "O(log n)", "O(n)", "O(n log n)", "B", AssessmentType.TECHNICAL, "Data Structures", DifficultyLevel.MEDIUM));

        // Python & Scripting
        list.add(q("Which of the following data types in Python is mutable?",
                "Tuple", "String", "List", "Integer", "C", AssessmentType.TECHNICAL, "Python", DifficultyLevel.EASY));
        list.add(q("What is the output of `bool('False')` in Python 3?",
                "False", "True", "None", "TypeError", "B", AssessmentType.TECHNICAL, "Python", DifficultyLevel.MEDIUM));
        list.add(q("What keyword is used in Python to create a generator function?",
                "return", "produce", "yield", "generator", "C", AssessmentType.TECHNICAL, "Python", DifficultyLevel.EASY));

        // SQL & DBMS
        list.add(q("Which normal form eliminates partial functional dependencies on candidate keys?",
                "1NF", "2NF", "3NF", "BCNF", "B", AssessmentType.TECHNICAL, "DBMS", DifficultyLevel.MEDIUM));
        list.add(q("In SQL, which clause is used to filter aggregated group results?",
                "WHERE", "ORDER BY", "HAVING", "GROUP BY", "C", AssessmentType.TECHNICAL, "SQL", DifficultyLevel.EASY));
        list.add(q("What does ACID stand for in database transaction management?",
                "Atomicity, Consistency, Isolation, Durability", "Accuracy, Concurrency, Integrity, Durability", "Atomicity, Concurrency, Isolation, Dependability", "Access, Control, Isolation, Data", "A", AssessmentType.TECHNICAL, "DBMS", DifficultyLevel.EASY));
        list.add(q("Which index type is default for primary key columns in MySQL InnoDB storage engine?",
                "B-Tree / Clustered Index", "Hash Index", "Bitmap Index", "Full-text Index", "A", AssessmentType.TECHNICAL, "SQL", DifficultyLevel.MEDIUM));
        list.add(q("What is the difference between DELETE and TRUNCATE in SQL?",
                "TRUNCATE is DDL and cannot be rolled back easily; DELETE is DML and logs each row deletion", "DELETE drops the table structure while TRUNCATE preserves it", "TRUNCATE requires a WHERE clause", "There is no functional difference", "A", AssessmentType.TECHNICAL, "SQL", DifficultyLevel.MEDIUM));

        // Spring Boot & Web
        list.add(q("In Spring Boot, which annotation is a combination of @Controller and @ResponseBody?",
                "@Service", "@Component", "@RestController", "@Endpoint", "C", AssessmentType.TECHNICAL, "Spring Boot", DifficultyLevel.EASY));
        list.add(q("What is the default scope of a Spring Bean?",
                "prototype", "singleton", "request", "session", "B", AssessmentType.TECHNICAL, "Spring Boot", DifficultyLevel.EASY));
        list.add(q("Which HTTP status code signifies that a requested resource was successfully created on the server?",
                "200 OK", "201 Created", "204 No Content", "202 Accepted", "B", AssessmentType.TECHNICAL, "Web Development", DifficultyLevel.EASY));
        list.add(q("In JavaScript, which statement is true about `const` declarations?",
                "They are globally hoisted without TDZ", "They can be re-declared in the same scope", "The variable binding cannot be reassigned", "They can only hold primitive numbers", "C", AssessmentType.TECHNICAL, "JavaScript", DifficultyLevel.EASY));
        list.add(q("In React, what hook is used to perform side effects in functional components?",
                "useState", "useEffect", "useContext", "useReducer", "B", AssessmentType.TECHNICAL, "React", DifficultyLevel.EASY));

        // Networks & Operating Systems
        list.add(q("Which layer of the OSI model does the TCP protocol operate on?",
                "Network Layer", "Transport Layer", "Data Link Layer", "Application Layer", "B", AssessmentType.TECHNICAL, "Computer Networks", DifficultyLevel.EASY));
        list.add(q("What is the default port number used by HTTP and HTTPS respectively?",
                "80 and 443", "8080 and 8443", "21 and 22", "53 and 67", "A", AssessmentType.TECHNICAL, "Computer Networks", DifficultyLevel.EASY));
        list.add(q("Which of the following conditions is NOT a necessary condition for a Deadlock in an Operating System?",
                "Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait", "C", AssessmentType.TECHNICAL, "Operating Systems", DifficultyLevel.MEDIUM));
        list.add(q("In OS virtual memory, what is the term for excessive page swapping between RAM and disk?",
                "Paging", "Thrashing", "Fragmentation", "Segmentation", "B", AssessmentType.TECHNICAL, "Operating Systems", DifficultyLevel.MEDIUM));
        list.add(q("Which scheduling algorithm gives the minimum average waiting time for a given set of processes?",
                "FCFS (First Come First Served)", "SJF (Shortest Job First)", "Round Robin", "Priority Scheduling", "B", AssessmentType.TECHNICAL, "Operating Systems", DifficultyLevel.MEDIUM));
        list.add(q("What protocol is used to translate a human-readable domain name (e.g. google.com) to an IP address?",
                "ARP", "DNS", "DHCP", "ICMP", "B", AssessmentType.TECHNICAL, "Computer Networks", DifficultyLevel.EASY));
        list.add(q("In CSS, which display value removes the element from document flow without showing space?",
                "visibility: hidden", "display: none", "opacity: 0", "position: static", "B", AssessmentType.TECHNICAL, "CSS", DifficultyLevel.EASY));

        questionRepository.saveAll(list);
    }

    private Question q(String text, String a, String b, String c, String d, String correct,
                      AssessmentType type, String topic, DifficultyLevel diff) {
        return Question.builder()
                .questionText(text)
                .optionA(a)
                .optionB(b)
                .optionC(c)
                .optionD(d)
                .correctAnswer(correct)
                .assessmentType(type)
                .topic(topic)
                .difficultyLevel(diff)
                .marks(1)
                .active(true)
                .build();
    }

    private void ensureAdminAccount() {
        String adminEmail = "inbaasara@gmail.com";
        String adminPassword = passwordEncoder.encode("Inbaa@1234");

        Optional<User> existingInbaa = userRepository.findByEmail(adminEmail);
        if (existingInbaa.isPresent()) {
            User adminUser = existingInbaa.get();
            adminUser.setRole(Role.ADMIN);
            adminUser.setPassword(adminPassword);
            adminUser.setStatus(UserStatus.ACTIVE);
            userRepository.save(adminUser);
            log.info("Admin user ensured: {}", adminEmail);
            return;
        }

        Optional<User> oldAdmin = userRepository.findByEmail("admin@careerready.ai");
        if (oldAdmin.isPresent()) {
            User adminUser = oldAdmin.get();
            adminUser.setEmail(adminEmail);
            adminUser.setPassword(adminPassword);
            adminUser.setRole(Role.ADMIN);
            adminUser.setStatus(UserStatus.ACTIVE);
            userRepository.save(adminUser);
            log.info("Migrated old Admin user to: {}", adminEmail);
        } else {
            userRepository.save(User.builder()
                    .name("System Administrator")
                    .email(adminEmail)
                    .password(adminPassword)
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build());
            log.info("Created Admin user: {}", adminEmail);
        }
    }

    private void seedUsersAndStudents(Map<String, Department> deptMap, Map<String, Skill> skillMap) {
        String defaultPw = passwordEncoder.encode("password123");

        // 1. ADMIN
        ensureAdminAccount();

        // 2. PLACEMENT HOD
        if (userRepository.findByEmail("hod@careerready.ai").isEmpty()) {
            User hodUser = userRepository.save(User.builder()
                    .name("Prof. K. Venkatesh")
                    .email("hod@careerready.ai")
                    .password(defaultPw)
                    .role(Role.PLACEMENT_HOD)
                    .status(UserStatus.ACTIVE)
                    .build());
            hodRepository.save(PlacementHod.builder()
                    .user(hodUser)
                    .department(deptMap.get("CSE"))
                    .build());
            log.info("Created HOD user: hod@careerready.ai");
        }

        // 3. PLACEMENT STAFF
        if (userRepository.findByEmail("staff@careerready.ai").isEmpty()) {
            User staffUser = userRepository.save(User.builder()
                    .name("Dr. R. Sharma")
                    .email("staff@careerready.ai")
                    .password(defaultPw)
                    .role(Role.PLACEMENT_STAFF)
                    .status(UserStatus.ACTIVE)
                    .build());
            staffRepository.save(PlacementStaff.builder()
                    .user(staffUser)
                    .department(deptMap.get("CSE"))
                    .build());
            log.info("Created Staff user: staff@careerready.ai");
        }

        // 4. BASELINE REGISTERED STUDENT: Arun Kumar (for initial student login)
        // No fake assessments or fake predictions are seeded - student must take real tests
        if (userRepository.findByEmail("student@careerready.ai").isEmpty()) {
            User studentUser = userRepository.save(User.builder()
                    .name("Arun Kumar")
                    .email("student@careerready.ai")
                    .password(defaultPw)
                    .role(Role.STUDENT)
                    .status(UserStatus.ACTIVE)
                    .build());

            Student arun = studentRepository.save(Student.builder()
                    .user(studentUser)
                    .registerNumber("23CSE001")
                    .department(deptMap.get("CSE"))
                    .year(4)
                    .cgpa(8.4)
                    .tenthPercentage(90.0)
                    .twelfthPercentage(88.0)
                    .backlogs(0)
                    .communicationScore(75)
                    .problemSolvingScore(80)
                    .teamworkScore(75)
                    .programmingScore(80)
                    .technicalSkillScore(75)
                    .build());

            // Assign initial student skills
            List<StudentSkill> arunSkills = List.of(
                    StudentSkill.builder().student(arun).skill(skillMap.get("Java")).currentLevel(SkillLevel.INTERMEDIATE).build(),
                    StudentSkill.builder().student(arun).skill(skillMap.get("SQL")).currentLevel(SkillLevel.INTERMEDIATE).build(),
                    StudentSkill.builder().student(arun).skill(skillMap.get("Spring Boot")).currentLevel(SkillLevel.BEGINNER).build(),
                    StudentSkill.builder().student(arun).skill(skillMap.get("React")).currentLevel(SkillLevel.BEGINNER).build()
            );
            studentSkillRepository.saveAll(arunSkills);
            log.info("Created Student user: student@careerready.ai");
        }
    }

    private void seedCmsContent() {
        if (cmsContentRepository.count() > 0 && globalSettingRepository.count() > 0) {
            log.info("CMS content and settings already seeded. Skipping CMS initialization.");
            return;
        }

        log.info("Seeding initial CMS content and global settings...");

        // Global settings
        Map<String, String[]> settings = Map.of(
                "app.name", new String[]{"CareerReady AI", "GENERAL", "Application display name"},
                "app.logo", new String[]{"", "GENERAL", "Custom Application Logo URL"},
                "app.tagline", new String[]{"Enterprise Placement Readiness & Competency Diagnostic Platform", "GENERAL", "Application tagline"},
                "app.support_email", new String[]{"placement@careerready.ai", "GENERAL", "Primary placement support email"},
                "app.footer_text", new String[]{"CareerReady AI Placement Management System. Empowering students, mentors, and corporate recruiters through verifiable performance metrics.", "GENERAL", "Footer informational description"},
                "app.copyright", new String[]{"© 2026 CareerReady AI. All rights reserved.", "GENERAL", "Copyright statement"},
                "app.website_url", new String[]{"https://careerready.ai", "GENERAL", "Institutional portal URL"}
        );

        for (Map.Entry<String, String[]> entry : settings.entrySet()) {
            if (globalSettingRepository.findBySettingKey(entry.getKey()).isEmpty()) {
                globalSettingRepository.save(GlobalSetting.builder()
                        .settingKey(entry.getKey())
                        .settingValue(entry.getValue()[0])
                        .settingGroup(entry.getValue()[1])
                        .description(entry.getValue()[2])
                        .updatedBy("system")
                        .build());
            }
        }

        // CMS Content: key, page, section, type, value, description
        String[][] contentItems = {
                // LANDING PAGE
                {"landing.hero.badge", "LANDING", "HERO", "TEXT", "AI-POWERED RECRUITMENT INTELLIGENCE", "Top badge above hero title"},
                {"landing.hero.title", "LANDING", "HERO", "TEXT", "Placement Readiness & Skill Gap Diagnostic Platform", "Main hero heading"},
                {"landing.hero.subtitle", "LANDING", "HERO", "TEXT", "Empowering institutions with data-driven predictive analytics, real-time competency evaluations, and recruitment matching tailored for corporate hiring.", "Hero introductory subtitle"},
                {"landing.hero.primary_btn", "LANDING", "HERO", "TEXT", "Start Placement Assessment", "Hero primary action button"},
                {"landing.hero.secondary_btn", "LANDING", "HERO", "TEXT", "Explore Recruitment Features", "Hero secondary action button"},
                {"landing.features.title", "LANDING", "FEATURES", "TEXT", "Key Diagnostic Features", "Features section header"},
                {"landing.features.subtitle", "LANDING", "FEATURES", "TEXT", "Comprehensive evaluation engine connecting academic records, standardized tests, and recruiter requirements.", "Features subtitle"},
                {"landing.cta.title", "LANDING", "CTA", "TEXT", "Accelerate Your Placement Preparation", "Bottom call-to-action title"},
                {"landing.cta.subtitle", "LANDING", "CTA", "TEXT", "Join leading institutions using CareerReady AI for verifiable readiness scoring.", "Bottom call-to-action subtitle"},
                {"landing.cta.btn", "LANDING", "CTA", "TEXT", "Get Started Today", "Bottom call-to-action button text"},

                // LOGIN PAGE
                {"login.title", "LOGIN", "HEADER", "TEXT", "Sign In to Placement Portal", "Login card main title"},
                {"login.subtitle", "LOGIN", "HEADER", "TEXT", "Authenticate with real database credentials", "Login card subtitle"},
                {"login.email_label", "LOGIN", "FORM", "TEXT", "Email Address", "Email input label"},
                {"login.password_label", "LOGIN", "FORM", "TEXT", "Password", "Password input label"},
                {"login.submit_btn", "LOGIN", "FORM", "TEXT", "Sign In", "Submit button label"},
                {"login.register_prompt", "LOGIN", "FOOTER", "TEXT", "New student registering for campus placements?", "Prompt text before register link"},
                {"login.register_link", "LOGIN", "FOOTER", "TEXT", "Create student profile", "Register link label"},

                // REGISTRATION PAGE
                {"register.title", "REGISTER", "HEADER", "TEXT", "Student Registration", "Registration card title"},
                {"register.subtitle", "REGISTER", "HEADER", "TEXT", "Enter your verified academic profile and skillset for real placement readiness analytics.", "Registration card subtitle"},
                {"register.submit_btn", "REGISTER", "FORM", "TEXT", "Complete Student Registration", "Registration submit button text"},
                {"register.login_prompt", "REGISTER", "FOOTER", "TEXT", "Already registered with university credentials?", "Prompt before login link"},
                {"register.login_link", "REGISTER", "FOOTER", "TEXT", "Sign In", "Login link text"},

                // STUDENT DASHBOARD
                {"student.dashboard.welcome_prefix", "STUDENT_DASHBOARD", "HEADER", "TEXT", "Welcome back", "Prefix before student name in header"},
                {"student.dashboard.journey_title", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "Placement Readiness Evaluation Journey", "Journey section heading"},
                {"student.dashboard.journey_subtitle", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "End-to-end analytical workflow from assessment to recruiter alignment", "Journey section subtitle"},
                {"student.dashboard.step1_title", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "Step 1 • Assessment Status", "Step 1 label"},
                {"student.dashboard.step2_title", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "Step 2 • Placement Readiness", "Step 2 label"},
                {"student.dashboard.step3_title", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "Step 3 • Company Matches", "Step 3 label"},
                {"student.dashboard.step4_title", "STUDENT_DASHBOARD", "JOURNEY", "TEXT", "Step 4 • Skill Gaps", "Step 4 label"},
                {"student.dashboard.readiness_pending", "STUDENT_DASHBOARD", "METRICS", "TEXT", "Complete both assessments to generate your Placement Readiness Score.", "Readiness card pending state subtext"},

                // ASSESSMENTS
                {"assessment.hub.title", "ASSESSMENT", "HUB", "TEXT", "Online Placement Assessment Hub", "Assessment hub title"},
                {"assessment.hub.subtitle", "ASSESSMENT", "HUB", "TEXT", "Standardized multi-tier evaluation pipeline covering Quantitative Aptitude, Logical Reasoning, and Core Technical CS Stacks.", "Assessment hub subtitle"},
                {"assessment.aptitude.title", "ASSESSMENT", "APTITUDE", "TEXT", "Aptitude Assessment", "Aptitude module title"},
                {"assessment.aptitude.desc", "ASSESSMENT", "APTITUDE", "TEXT", "Quantitative problem solving, logical deduction, and verbal reasoning.", "Aptitude module description"},
                {"assessment.aptitude.time_limit", "ASSESSMENT", "APTITUDE", "TEXT", "30 Minutes • 20 Multiple Choice Questions", "Aptitude time and question count"},
                {"assessment.aptitude.instructions", "ASSESSMENT", "APTITUDE", "RICH_TEXT", "Ensure a stable internet connection. Each question carries 1 mark. Negative marking is not applicable.", "Aptitude instructions"},
                {"assessment.technical.title", "ASSESSMENT", "TECHNICAL", "TEXT", "Technical Assessment", "Technical module title"},
                {"assessment.technical.desc", "ASSESSMENT", "TECHNICAL", "TEXT", "Core Computer Science, Object-Oriented Programming, Data Structures, DBMS, and System Architecture.", "Technical module description"},
                {"assessment.technical.time_limit", "ASSESSMENT", "TECHNICAL", "TEXT", "30 Minutes • 20 Multiple Choice Questions", "Technical time and question count"},
                {"assessment.technical.instructions", "ASSESSMENT", "TECHNICAL", "RICH_TEXT", "Evaluate your technical concepts across Algorithms, OOP, Database Queries, and Web Stacks.", "Technical instructions"},
                {"assessment.submit_btn", "ASSESSMENT", "QUIZ", "TEXT", "Submit Assessment", "Quiz submit button text"},

                // READINESS
                {"readiness.title", "READINESS", "HEADER", "TEXT", "Placement Readiness Evaluation", "Readiness page title"},
                {"readiness.subtitle", "READINESS", "HEADER", "TEXT", "Comprehensive diagnostic synthesis connecting your Aptitude, Technical assessment, and academic performance.", "Readiness page subtitle"},
                {"readiness.empty_title", "READINESS", "EMPTY", "TEXT", "Complete both Aptitude and Technical Assessments to generate your Placement Readiness Score.", "Empty state title when incomplete"},
                {"readiness.empty_desc", "READINESS", "EMPTY", "TEXT", "A student must complete both the Aptitude Assessment and Technical Assessment before the placement readiness prediction is generated from your actual performance data.", "Empty state description"},
                {"readiness.trajectory_title", "READINESS", "TRAJECTORY", "TEXT", "Readiness Score Trajectory", "Trajectory section title"},
                {"readiness.trajectory_subtitle", "READINESS", "TRAJECTORY", "TEXT", "Chronological progression of your placement readiness evaluations", "Trajectory section subtitle"},
                {"readiness.trajectory_empty", "READINESS", "TRAJECTORY", "TEXT", "Readiness trajectory will appear after sufficient assessment and academic data is available.", "Trajectory empty state notice"},
                {"readiness.rubric_title", "READINESS", "RUBRIC", "TEXT", "Institutional Readiness Classification Rubric", "Rubric section title"},
                {"readiness.desc_highly_ready", "READINESS", "RUBRIC", "TEXT", "Exceptional readiness across coding, aptitude, and high CGPA. Eligible for super-dream and product interviews.", "Highly ready description"},
                {"readiness.desc_ready", "READINESS", "RUBRIC", "TEXT", "Meets core corporate hiring cutoffs. Eligible for major IT services and technology solutions drives.", "Ready description"},
                {"readiness.desc_needs_improvement", "READINESS", "RUBRIC", "TEXT", "Specific gaps detected in either aptitude speed or technical frameworks. Requires targeted practice modules.", "Needs improvement description"},
                {"readiness.desc_at_risk", "READINESS", "RUBRIC", "TEXT", "High backlog risk or severe deficit in coding/quantitative benchmarks. Flagged for placement mentor support.", "At risk description"},

                // COMPANY MATCHING & SKILL GAPS
                {"company.matching.title", "COMPANY_MATCHING", "HEADER", "TEXT", "Company Matches", "Company matching title"},
                {"company.matching.subtitle", "COMPANY_MATCHING", "HEADER", "TEXT", "Explore companies that align with your current profile and placement readiness.", "Company matching subtitle"},
                {"company.matched_skills_label", "COMPANY_MATCHING", "CARD", "TEXT", "Matched Skills", "Matched skills section label"},
                {"company.skill_gaps_label", "COMPANY_MATCHING", "CARD", "TEXT", "Skill Gaps", "Skill gaps section label"},
                {"company.no_skill_gaps", "COMPANY_MATCHING", "CARD", "TEXT", "No skill gaps identified", "Notice when company skill gaps is empty"},
                {"company.no_companies", "COMPANY_MATCHING", "EMPTY", "TEXT", "No company matches available.", "Empty state when no companies match"},
                {"skillgap.title", "SKILL_GAP", "HEADER", "TEXT", "Skill Gap Analysis", "Skill gap page title"},
                {"skillgap.subtitle", "SKILL_GAP", "HEADER", "TEXT", "Identify the skills you need to strengthen for your target companies.", "Skill gap page subtitle"},

                // STAFF & HOD
                {"staff.dashboard.title", "STAFF_DASHBOARD", "HEADER", "TEXT", "Staff Placement Workspace", "Staff dashboard heading"},
                {"staff.dashboard.subtitle", "STAFF_DASHBOARD", "HEADER", "TEXT", "Cohort tracking, assessment results monitoring, and corporate eligibility.", "Staff dashboard subtitle"},
                {"hod.dashboard.title", "HOD_DASHBOARD", "HEADER", "TEXT", "Institutional Placement Overview", "HOD dashboard heading"},
                {"hod.dashboard.subtitle", "HOD_DASHBOARD", "HEADER", "TEXT", "Department-level placement metrics, recruitment conversion, and at-risk monitoring.", "HOD dashboard subtitle"}
        };

        for (String[] item : contentItems) {
            if (cmsContentRepository.findByContentKey(item[0]).isEmpty()) {
                cmsContentRepository.save(CmsContent.builder()
                        .contentKey(item[0])
                        .page(item[1])
                        .section(item[2])
                        .contentType(ContentType.valueOf(item[3]))
                        .contentValue(item[4])
                        .description(item[5])
                        .isActive(true)
                        .updatedBy("system")
                        .build());
            }
        }

        log.info("Seeded default CMS content ({} items) and global settings successfully.", contentItems.length);
    }
}
