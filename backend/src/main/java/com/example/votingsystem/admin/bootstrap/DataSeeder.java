package com.example.votingsystem.admin.bootstrap;

import com.example.votingsystem.admin.domain.Role;
import com.example.votingsystem.admin.domain.User;
import com.example.votingsystem.admin.repo.UserRepository;
import com.example.votingsystem.nominee.entity.Category;
import com.example.votingsystem.nominee.entity.Event;
import com.example.votingsystem.nominee.entity.Nominee;
import com.example.votingsystem.nominee.repository.CategoryRepository;
import com.example.votingsystem.nominee.repository.EventRepository;
import com.example.votingsystem.nominee.repository.NomineeRepository;
import com.example.votingsystem.notification.model.Notification;
import com.example.votingsystem.notification.repo.NotificationRepository;
import com.example.votingsystem.student.domain.Gender;
import com.example.votingsystem.student.domain.Student;
import com.example.votingsystem.student.repo.StudentRepository;
import com.example.votingsystem.voting.entity.Vote;
import com.example.votingsystem.voting.repository.VoteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@Profile("!prod")
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsers(UserRepository repo, PasswordEncoder enc) {
        // Runs at app startup; creates default users if they don't exist
        return args -> {
            if (!repo.existsByUsername("admin")) {
                repo.save(new User("admin", enc.encode("123"), Role.ADMIN));
            }
            if (!repo.existsByUsername("organizer")) {
                repo.save(new User("organizer", enc.encode("123"), Role.ORGANIZER));
            }
            if (!repo.existsByUsername("student")) {
                repo.save(new User("student", enc.encode("123"), Role.STUDENT));
            }
            if (!repo.existsByUsername("itc")) {
                repo.save(new User("itc", enc.encode("123"), Role.IT_COORDINATOR));
            }
        };
    }

    @Bean
    CommandLineRunner seedDummyData(
            StudentRepository studentRepo,
            EventRepository eventRepo,
            CategoryRepository categoryRepo,
            NomineeRepository nomineeRepo,
            VoteRepository voteRepo,
            NotificationRepository notificationRepo,
            PasswordEncoder enc) {
        return args -> {
            // ── Skip if data already exists ──────────────────────────
            if (studentRepo.count() > 0)
                return;

            // ── 1. Students ─────────────────────────────────────────
            Student s1 = makeStudent("STU001", "Kavisha Lakshan", "kavisha@university.edu", enc.encode("pass123"),
                    Gender.MALE);
            Student s2 = makeStudent("STU002", "Nimasha Perera", "nimasha@university.edu", enc.encode("pass123"),
                    Gender.FEMALE);
            Student s3 = makeStudent("STU003", "Tharuka Silva", "tharuka@university.edu", enc.encode("pass123"),
                    Gender.MALE);
            Student s4 = makeStudent("STU004", "Sanduni Fernando", "sanduni@university.edu", enc.encode("pass123"),
                    Gender.FEMALE);
            Student s5 = makeStudent("STU005", "Dineth Jayasuriya", "dineth@university.edu", enc.encode("pass123"),
                    Gender.MALE);
            Student s6 = makeStudent("STU006", "Ishara Kumari", "ishara@university.edu", enc.encode("pass123"),
                    Gender.FEMALE);
            Student s7 = makeStudent("STU007", "Ravindu Bandara", "ravindu@university.edu", enc.encode("pass123"),
                    Gender.MALE);
            Student s8 = makeStudent("STU008", "Chamodi Wijesinghe", "chamodi@university.edu", enc.encode("pass123"),
                    Gender.FEMALE);
            Student s9 = makeStudent("STU009", "Ashan De Silva", "ashan@university.edu", enc.encode("pass123"),
                    Gender.MALE);
            Student s10 = makeStudent("STU010", "Nethmi Rodrigo", "nethmi@university.edu", enc.encode("pass123"),
                    Gender.FEMALE);
            studentRepo.saveAll(List.of(s1, s2, s3, s4, s5, s6, s7, s8, s9, s10));

            // ── 2. Events ───────────────────────────────────────────
            Event event1 = new Event();
            event1.setName("Bright Future Student Awards 2026");
            event1.setDescription(
                    "Annual student awards ceremony recognizing outstanding academic achievements and extracurricular contributions.");
            event1.setStartAt(LocalDateTime.now().minusDays(2));
            event1.setEndAt(LocalDateTime.now().plusDays(30));

            Event event2 = new Event();
            event2.setName("Dean's List Awards 2025");
            event2.setDescription("Past ceremony honoring students on the Dean's List for the 2025 academic year.");
            event2.setStartAt(LocalDateTime.of(2025, 9, 1, 9, 0));
            event2.setEndAt(LocalDateTime.of(2025, 10, 15, 23, 59));
            eventRepo.saveAll(List.of(event1, event2));

            // ── 3. Categories (under Event 1 — active) ─────────────
            Category cat1 = makeCat("Best Academic Performer",
                    "Awarded to the student with the highest GPA and academic consistency.",
                    event1, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(28));

            Category cat2 = makeCat("Best Community Leader",
                    "Recognizes students who made significant positive impact in the university community.",
                    event1, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(28));

            Category cat3 = makeCat("Best Innovator",
                    "For the student who demonstrated the most creative and impactful project or invention.",
                    event1, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(28));

            Category cat4 = makeCat("Best Sportsperson",
                    "Celebrates excellence in university sports and athletic achievements.",
                    event1, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(28));

            // ── Categories (under Event 2 — past) ──────────────────
            Category cat5 = makeCat("Outstanding Research Contribution",
                    "For students who published impactful research papers.",
                    event2, LocalDateTime.of(2025, 9, 1, 9, 0), LocalDateTime.of(2025, 10, 15, 23, 59));

            Category cat6 = makeCat("Best Volunteer",
                    "Recognizes selfless community service and volunteering efforts.",
                    event2, LocalDateTime.of(2025, 9, 1, 9, 0), LocalDateTime.of(2025, 10, 15, 23, 59));
            categoryRepo.saveAll(List.of(cat1, cat2, cat3, cat4, cat5, cat6));

            // ── 4. Nominees ─────────────────────────────────────────
            // Cat 1 — Best Academic Performer (3 nominees)
            Nominee n1 = makeNom("Kavisha Lakshan",
                    "4.0 GPA, Dean's List 6 semesters running. Published 2 research papers in AI.", cat1);
            Nominee n2 = makeNom("Nimasha Perera",
                    "3.95 GPA, National Science Olympiad gold medalist. Tutors junior students.", cat1);
            Nominee n3 = makeNom("Ashan De Silva",
                    "3.89 GPA, Full scholarship recipient. Top performer in every module.", cat1);

            // Cat 2 — Best Community Leader (3 nominees)
            Nominee n4 = makeNom("Sanduni Fernando",
                    "President of Student Council. Led campus sustainability initiative.", cat2);
            Nominee n5 = makeNom("Tharuka Silva", "Founded university coding bootcamp. Mentored 50+ juniors.", cat2);
            Nominee n6 = makeNom("Ishara Kumari",
                    "Organized 12 charity events. Raised over Rs. 2M for underprivileged students.", cat2);

            // Cat 3 — Best Innovator (3 nominees)
            Nominee n7 = makeNom("Dineth Jayasuriya",
                    "Built an AI-powered campus navigation app used by 3,000+ students.", cat3);
            Nominee n8 = makeNom("Ravindu Bandara", "Developed a solar-powered IoT system for smart agriculture.",
                    cat3);
            Nominee n9 = makeNom("Nethmi Rodrigo", "Created an award-winning AR application for medical training.",
                    cat3);

            // Cat 4 — Best Sportsperson (3 nominees)
            Nominee n10 = makeNom("Chamodi Wijesinghe",
                    "University athletics champion. National record in 100m sprint.", cat4);
            Nominee n11 = makeNom("Kavisha Lakshan",
                    "Captain of university cricket team. Led team to inter-university finals.", cat4);
            Nominee n12 = makeNom("Tharuka Silva", "Represented Sri Lanka in university basketball tournament.", cat4);

            // Cat 5 — Outstanding Research (3 nominees, past event)
            Nominee n13 = makeNom("Ashan De Silva", "Published 3 papers in IEEE. Research in quantum computing.", cat5);
            Nominee n14 = makeNom("Nimasha Perera", "Co-authored a Nature publication on biomedical engineering.",
                    cat5);
            Nominee n15 = makeNom("Dineth Jayasuriya", "Machine learning research presented at ACM conference.", cat5);

            // Cat 6 — Best Volunteer (3 nominees, past event)
            Nominee n16 = makeNom("Ishara Kumari", "500+ hours of community service. Teaches coding at rural schools.",
                    cat6);
            Nominee n17 = makeNom("Sanduni Fernando", "Led flood relief campaigns across 3 districts.", cat6);
            Nominee n18 = makeNom("Nethmi Rodrigo", "Volunteered at 4 orphanages. Organized STEM workshops.", cat6);
            nomineeRepo
                    .saveAll(List.of(n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, n13, n14, n15, n16, n17, n18));

            // ── 5. Votes (for active event categories) ──────────────
            // Each student votes once per category, spread across nominees
            voteRepo.saveAll(List.of(
                    // Cat 1 votes — Best Academic Performer
                    makeVote(s1, cat1, n2), // Kavisha votes for Nimasha
                    makeVote(s2, cat1, n1), // Nimasha votes for Kavisha
                    makeVote(s3, cat1, n1), // Tharuka votes for Kavisha
                    makeVote(s4, cat1, n3), // Sanduni votes for Ashan
                    makeVote(s5, cat1, n1), // Dineth votes for Kavisha
                    makeVote(s6, cat1, n2), // Ishara votes for Nimasha
                    makeVote(s7, cat1, n1), // Ravindu votes for Kavisha
                    makeVote(s8, cat1, n3), // Chamodi votes for Ashan

                    // Cat 2 votes — Best Community Leader
                    makeVote(s1, cat2, n4), // votes for Sanduni
                    makeVote(s2, cat2, n6), // votes for Ishara
                    makeVote(s3, cat2, n5), // votes for Tharuka
                    makeVote(s4, cat2, n4), // votes for Sanduni
                    makeVote(s5, cat2, n6), // votes for Ishara
                    makeVote(s6, cat2, n4), // votes for Sanduni
                    makeVote(s7, cat2, n5), // votes for Tharuka

                    // Cat 3 votes — Best Innovator
                    makeVote(s1, cat3, n7), // votes for Dineth
                    makeVote(s2, cat3, n9), // votes for Nethmi
                    makeVote(s3, cat3, n8), // votes for Ravindu
                    makeVote(s4, cat3, n7), // votes for Dineth
                    makeVote(s5, cat3, n7), // votes for Dineth
                    makeVote(s6, cat3, n9), // votes for Nethmi

                    // Cat 4 votes — Best Sportsperson
                    makeVote(s1, cat4, n10), // votes for Chamodi
                    makeVote(s2, cat4, n11), // votes for Kavisha
                    makeVote(s3, cat4, n12), // votes for Tharuka
                    makeVote(s4, cat4, n10), // votes for Chamodi
                    makeVote(s5, cat4, n11), // votes for Kavisha
                    makeVote(s6, cat4, n10), // votes for Chamodi
                    makeVote(s7, cat4, n12), // votes for Tharuka
                    makeVote(s8, cat4, n10), // votes for Chamodi
                    makeVote(s9, cat4, n11) // votes for Kavisha
            ));

            // ── 6. Notifications ────────────────────────────────────
            Notification notif1 = makeNotif("all-students@university.edu",
                    "🎉 Voting is Now Open!",
                    "Dear Students,\n\nThe Bright Future Student Awards 2026 voting is now open! Log in to cast your votes across all categories.\n\nVoting closes in 30 days.",
                    Notification.Status.SENT, Instant.now().minusSeconds(86400));

            Notification notif2 = makeNotif("kavisha@university.edu",
                    "🏆 You've Been Nominated!",
                    "Congratulations Kavisha!\n\nYou have been nominated for Best Academic Performer and Best Sportsperson in the Bright Future Student Awards 2026.",
                    Notification.Status.SENT, Instant.now().minusSeconds(72000));

            Notification notif3 = makeNotif("nimasha@university.edu",
                    "🏆 You've Been Nominated!",
                    "Congratulations Nimasha!\n\nYou have been nominated for Best Academic Performer in the Bright Future Student Awards 2026.",
                    Notification.Status.SENT, Instant.now().minusSeconds(72000));

            Notification notif4 = makeNotif("all-students@university.edu",
                    "⏰ Voting Reminder",
                    "Dear Students,\n\nThis is a friendly reminder that the Bright Future Student Awards 2026 voting is still in progress.\n\nDon't miss your chance to vote!",
                    Notification.Status.PENDING, null);

            Notification notif5 = makeNotif("admin@university.edu",
                    "📊 Weekly Voting Report",
                    "Weekly voting summary:\n- Total votes cast: 30\n- Categories with most activity: Best Academic Performer, Best Sportsperson\n- Students who haven't voted yet: STU009, STU010",
                    Notification.Status.FAILED, null);
            notif5.setError("SMTP connection refused: host smtp.gmail.com port 587");
            notif5.setAttempts(3);

            notificationRepo.saveAll(List.of(notif1, notif2, notif3, notif4, notif5));

            System.out.println("✅ Dummy data seeded successfully!");
            System.out.println("   → 10 students");
            System.out.println("   → 2 events (1 active, 1 past)");
            System.out.println("   → 6 categories");
            System.out.println("   → 18 nominees");
            System.out.println("   → 30 votes");
            System.out.println("   → 5 notifications");
        };
    }

    // ── Helper methods ──────────────────────────────────────────────

    private Student makeStudent(String indexNo, String fullName, String email, String pwHash, Gender gender) {
        Student s = new Student();
        s.setIndexNo(indexNo);
        s.setFullName(fullName);
        s.setEmail(email);
        s.setPasswordHash(pwHash);
        s.setActive(true);
        s.setGender(gender);
        return s;
    }

    private Category makeCat(String name, String desc, Event event, LocalDateTime start, LocalDateTime end) {
        Category c = new Category();
        c.setName(name);
        c.setDescription(desc);
        c.setEvent(event);
        c.setVotingStart(start);
        c.setVotingEnd(end);
        c.setActive(true);
        return c;
    }

    private Nominee makeNom(String name, String bio, Category cat) {
        Nominee n = new Nominee();
        n.setName(name);
        n.setBio(bio);
        n.setCategory(cat);
        return n;
    }

    private Vote makeVote(Student student, Category category, Nominee nominee) {
        Vote v = new Vote();
        v.setStudent(student);
        v.setCategory(category);
        v.setNominee(nominee);
        return v;
    }

    private Notification makeNotif(String recipient, String subject, String body, Notification.Status status,
            Instant sentAt) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setSubject(subject);
        n.setBody(body);
        n.setStatus(status);
        n.setSentAt(sentAt);
        return n;
    }
}
