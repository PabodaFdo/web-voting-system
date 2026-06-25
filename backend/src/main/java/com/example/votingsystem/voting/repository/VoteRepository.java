package com.example.votingsystem.voting.repository;

import com.example.votingsystem.voting.entity.Vote;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByStudent_IdAndCategory_Id(Long studentId, Long categoryId);

    long countByCategory_IdAndNominee_Id(Long categoryId, Long nomineeId);

    List<Vote> findByStudent_Id(Long studentId);

    void deleteByStudent_IdAndCategory_Id(Long studentId, Long categoryId);

    @Query("""
      select count(v.id)
      from Vote v join v.category c
      where c.event.id = :eventId
    """)
    long countByEvent(@Param("eventId") Long eventId);

    @Query("""
      select c.id, c.name, count(v.id)
      from Vote v join v.category c
      where c.event.id = :eventId
      group by c.id, c.name
      order by c.name asc
    """)
    List<Object[]> categoryVoteCounts(@Param("eventId") Long eventId);

    @Query("""
      select n.id, n.name, count(v.id)
      from Vote v join v.category c join v.nominee n
      where c.event.id = :eventId and c.id = :categoryId
      group by n.id, n.name
      order by count(v.id) desc
    """)
    List<Object[]> nomineeCountsInCategory(@Param("eventId") Long eventId,
                                           @Param("categoryId") Long categoryId);

    @Query("""
      select n.id, n.name, count(v.id)
      from Vote v join v.category c join v.nominee n
      where c.event.id = :eventId
      group by n.id, n.name
      order by count(v.id) desc
    """)
    List<Object[]> topNominees(@Param("eventId") Long eventId, Pageable pageable);

    // H2-safe: cast timestamp -> date (works across H2/MySQL/Postgres via Hibernate)
    @Query("""
      select cast(v.createdAt as date) as d, count(v.id)
      from Vote v join v.category c
      where c.event.id = :eventId
      group by cast(v.createdAt as date)
      order by cast(v.createdAt as date) asc
    """)
    List<Object[]> dailyCounts(@Param("eventId") Long eventId);
}
