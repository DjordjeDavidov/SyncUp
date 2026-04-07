const bcrypt = require("bcrypt");
const {
  community_visibility,
  invite_visibility,
  profile_visibility,
  social_mode,
  verification_status,
} = require("@prisma/client");
const {
  DEMO_EMAIL_DOMAIN,
  DEMO_PASSWORD,
  communities: communitySeeds,
  communityChatPlans,
  directMessagePlans,
} = require("./world");
const {
  createAvatarUrl,
  createBannerDataUri,
  createRng,
  daysAgo,
  daysFromNow,
  pick,
  randomInt,
  sampleSize,
  shuffle,
  slugify,
  unique,
} = require("./utils");

const topicPosts = {
  Hiking: [
    "Avala on Saturday if weather stays decent?",
    "Thinking of starting a beginner hiking loop every other weekend.",
    "Anyone else prefer easy hikes with a long coffee stop after?",
    "Found a route that feels scenic without destroying your knees.",
  ],
  Coffee: [
    "Best quiet cafe for working with a laptop lately?",
    "Found a great coffee place near the center and the playlist was surprisingly good.",
    "Need a new weekend coffee spot with actual comfortable chairs.",
    "Who knows a cafe where nobody looks annoyed if you stay two hours?",
  ],
  Movies: [
    "Watched a surprisingly good movie yesterday and now I need recommendations.",
    "Anyone watching something good this week?",
    "I miss small movie nights where nobody talks during the good scenes.",
    "Still thinking about last night's ending and not in a bad way.",
  ],
  Fitness: [
    "Looking for a beginner-friendly gym partner who won't judge my cardio breaks.",
    "Trying to get consistent again. Morning training or evening training?",
    "If anyone wants a low-pressure gym session this week, I'm in.",
    "Need an accountability person for not skipping workouts after work.",
  ],
  Photography: [
    "Dropped some new street shots from yesterday.",
    "Sunset looked unreal tonight. Worth carrying the camera for once.",
    "Trying to shoot more ordinary city moments instead of only pretty ones.",
    "Anyone down for a slow photo walk this week?",
  ],
  Travel: [
    "Cheap weekend escape ideas from Belgrade?",
    "I keep saving train routes I'll probably take last minute.",
    "Need recommendations for a short trip that doesn't require overplanning.",
    "Trying to build a list of easy weekend escapes before summer gets busy.",
  ],
  Coding: [
    "Anyone else working on side projects after 9pm for no good reason?",
    "Shipped a tiny fix today and I am treating it like a major release.",
    "Looking for a chill coworking spot with decent wifi and even better coffee.",
    "Trying to stay consistent with one side project instead of starting five.",
  ],
  Gaming: [
    "Anybody up for a casual co-op session later this week?",
    "Need game recs that are fun with friends and don't require a full-time job.",
    "Trying to find people who are competitive but still normal about it.",
    "I want one game night where nobody rage quits.",
  ],
  "Language Exchange": [
    "Anyone wants to practice English this week?",
    "Would love a low-pressure language exchange meetup soon.",
    "Trying to keep my Spanish alive without turning it into homework.",
    "If anyone is learning Korean or Chinese, I'd love to practice basics together.",
  ],
  "Study Groups": [
    "Need a quiet place for a study session with decent coffee nearby.",
    "Anyone doing a library sprint this week?",
    "Study first, snack break after. That's the plan.",
    "Looking for people who actually help each other focus instead of gossiping for two hours.",
  ],
  "Board Games": [
    "Need two more people for board games tonight.",
    "Trying to revive a proper midweek board game habit.",
    "What's your pick for introducing new people to board games without chaos?",
    "I want one board game night where we actually finish the long game.",
  ],
  Basketball: [
    "Need one more for 3v3 basketball tonight.",
    "Anyone up for a low-pressure run this weekend?",
    "Trying to make pickup games feel fun again and not like tryouts.",
    "Court was empty yesterday and it felt illegal not to play.",
  ],
  Music: [
    "Need new playlists for late coffee runs and early buses.",
    "Anyone else building very specific playlists for very normal errands?",
    "Looking for songs that feel like walking home after a long day.",
    "Share one album you've had on repeat lately.",
  ],
  Design: [
    "Trying to stop overthinking a landing page and just ship it.",
    "Does anyone else collect cool poster references and never use them?",
    "Need opinions on simple design systems that don't feel boring.",
    "Found a font combo I love and now I want to redesign everything.",
  ],
};

const topicComments = {
  Hiking: ["I'd be up for that.", "This sounds perfect honestly.", "Beginner-friendly is the key phrase here.", "Keep me posted on the plan."],
  Coffee: ["Please share the name.", "I need this recommendation too.", "Window light and good chairs are non-negotiable.", "Saving this for the weekend."],
  Movies: ["Okay now I need the title.", "Hard agree with this one.", "This would be fun as a group watch.", "Adding it to my list."],
  Fitness: ["I'd join a beginner session.", "This is exactly my speed.", "Same, I need accountability too.", "Evening training always wins for me."],
  Photography: ["Would love to see the full set.", "The light really was good today.", "A photo walk sounds great.", "These kinds of days make carrying the camera worth it."],
  Travel: ["Following for ideas.", "A short trip sounds so good right now.", "Please report back if you go.", "This is exactly the kind of plan I like."],
  Coding: ["Relatable on every level.", "A coworking session would actually help.", "Tiny fixes count as wins.", "I need that kind of momentum too."],
  Gaming: ["I'd be down for something casual.", "Co-op sounds more fun than ranked right now.", "Normal about it is the dream.", "Tell me what game and I'm interested."],
  "Language Exchange": ["I'd join if it's beginner-friendly.", "Low-pressure practice sounds ideal.", "I need this kind of consistency.", "Count me in for English practice."],
  "Study Groups": ["A focused study session would save me.", "I can do one this week.", "Yes to study first, snack later.", "This sounds way more productive than studying alone."],
  "Board Games": ["I'm in if someone explains the rules patiently.", "This sounds like a good night.", "We need more midweek plans like this.", "Very interested in the snack situation too."],
  Basketball: ["I can probably make it.", "Low-pressure runs are the best runs.", "Let me know the time.", "I miss casual games like this."],
  Music: ["Need that playlist link.", "I love oddly specific playlists.", "Now I'm curious what made the cut.", "Late-night walking songs are a real category."],
  Design: ["Honestly just ship it.", "I want to see this when it's ready.", "Good design references are half the battle.", "A simple system done well always wins."],
  generic: ["I'd join this.", "This sounds good.", "Honestly same.", "Keep me in the loop."],
};

const eventPlans = [
  { creator: "mila.walks", communitySlug: "belgrade-hike-crew", category: "Hikes", title: "Avala Saturday loop", content: "Easy pace, good views, and coffee after if everyone is still alive.", locationText: "Avala Tower parking", city: "Belgrade", country: "Serbia", daysAhead: 4, maxParticipants: 10, inviteVisibility: invite_visibility.PUBLIC, participants: ["markoontrail", "andrej.roam", "nikfit"], postType: "INVITE_POST" },
  { creator: "vuk.boards", communitySlug: "board-game-evenings", category: "Board Games", title: "Wednesday board game night", content: "Starting with easier games, then deciding if we go chaotic after.", locationText: "Dorcol board game cafe", city: "Belgrade", country: "Serbia", daysAhead: 2, maxParticipants: 8, inviteVisibility: invite_visibility.PUBLIC, participants: ["boris.weekend", "mila.walks", "sara.studies"], postType: "INVITE_POST" },
  { creator: "petar.pickup", communitySlug: "casual-hoops", category: "Basketball", title: "Friday 3v3 run", content: "Nothing serious, just enough effort to deserve post-game food.", locationText: "Tasmajdan outdoor court", city: "Belgrade", country: "Serbia", daysAhead: 3, maxParticipants: 6, inviteVisibility: invite_visibility.PUBLIC, participants: ["nikfit", "filip.flex", "stefcodes"], postType: "ACTIVITY_POST" },
  { creator: "ana.abroad", communitySlug: "language-exchange-corner", category: "Language Practice", title: "English & Spanish cafe practice", content: "Small tables, beginner-friendly, zero pressure if you need to switch back to Serbian.", locationText: "Skadarlija cafe corner", city: "Belgrade", country: "Serbia", daysAhead: 5, maxParticipants: 12, inviteVisibility: invite_visibility.FOLLOWERS_FRIENDS, participants: ["ivana.words", "kat.studybreak", "andrej.roam"], postType: "INVITE_POST" },
  { creator: "lenalens", communitySlug: "photo-walks-serbia", category: "Photo Walks", title: "Sunset photo walk by the river", content: "Golden hour only. Bring any camera, or just your phone and good shoes.", locationText: "Danube quay", city: "Novi Sad", country: "Serbia", daysAhead: 6, maxParticipants: 9, inviteVisibility: invite_visibility.PUBLIC, participants: ["dunja.frames", "nina.pixel", "mari.movienotes"], postType: "ACTIVITY_POST" },
];

function buildDemoEmail(username) {
  return `${username.replace(/[^a-z0-9.]/g, "")}@${DEMO_EMAIL_DOMAIN}`;
}

function getFullName(user) {
  return `${user.firstName} ${user.lastName}`;
}

function createTopicRotation(user) {
  return unique([...user.interests, ...user.activityCategories.map((value) => value.replace(/s$/, ""))]);
}

function getPostTopic(user, index) {
  const rotation = createTopicRotation(user);
  return rotation[index % rotation.length] || user.interests[0] || "generic";
}

function getTopicCommentPool(topic) {
  return topicComments[topic] || topicComments.generic;
}

function getPostCount(user) {
  if (user.activityLevel === "high") {
    return 2;
  }
  if (user.activityLevel === "medium") {
    return 2;
  }
  return 1;
}

async function resetDemoData(prisma) {
  const demoUsers = await prisma.users.findMany({
    where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((user) => user.id);
  const demoCommunities = await prisma.communities.findMany({
    where: { slug: { in: communitySeeds.map((community) => community.slug) } },
    select: { id: true },
  });
  const demoCommunityIds = demoCommunities.map((community) => community.id);
  const demoActivities = await prisma.activities.findMany({
    where: {
      OR: [{ creator_id: { in: demoUserIds } }, { community_id: { in: demoCommunityIds } }],
    },
    select: { id: true },
  });
  const demoActivityIds = demoActivities.map((activity) => activity.id);
  const demoPosts = await prisma.posts.findMany({
    where: {
      OR: [
        { author_id: { in: demoUserIds } },
        { community_id: { in: demoCommunityIds } },
        { activity_id: { in: demoActivityIds } },
      ],
    },
    select: { id: true },
  });
  const demoPostIds = demoPosts.map((post) => post.id);
  const demoCommunityChats = await prisma.community_chats.findMany({
    where: { community_id: { in: demoCommunityIds } },
    select: { id: true },
  });
  const demoCommunityChatIds = demoCommunityChats.map((chat) => chat.id);
  const demoThreads = await prisma.direct_message_threads.findMany({
    where: { participants: { some: { user_id: { in: demoUserIds } } } },
    select: { id: true },
  });
  const demoThreadIds = demoThreads.map((thread) => thread.id);

  await prisma.$transaction([
    prisma.notifications.deleteMany({
      where: {
        OR: [
          { user_id: { in: demoUserIds } },
          { actor_id: { in: demoUserIds } },
          { related_user_id: { in: demoUserIds } },
          { related_post_id: { in: demoPostIds } },
          { related_community_id: { in: demoCommunityIds } },
          { related_activity_id: { in: demoActivityIds } },
        ],
      },
    }),
    prisma.poll_votes.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { post_id: { in: demoPostIds } }] } }),
    prisma.post_likes.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { post_id: { in: demoPostIds } }] } }),
    prisma.post_saves.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { post_id: { in: demoPostIds } }] } }),
    prisma.post_comments.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { post_id: { in: demoPostIds } }] } }),
    prisma.poll_options.deleteMany({ where: { post_id: { in: demoPostIds } } }),
    prisma.direct_messages.deleteMany({ where: { OR: [{ sender_id: { in: demoUserIds } }, { thread_id: { in: demoThreadIds } }] } }),
    prisma.direct_message_thread_participants.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { thread_id: { in: demoThreadIds } }] } }),
    prisma.direct_message_threads.deleteMany({ where: { id: { in: demoThreadIds } } }),
    prisma.community_chat_messages.deleteMany({ where: { OR: [{ sender_id: { in: demoUserIds } }, { community_chat_id: { in: demoCommunityChatIds } }] } }),
    prisma.community_chats.deleteMany({ where: { OR: [{ id: { in: demoCommunityChatIds } }, { community_id: { in: demoCommunityIds } }] } }),
    prisma.activity_participants.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { activity_id: { in: demoActivityIds } }] } }),
    prisma.posts.deleteMany({ where: { OR: [{ id: { in: demoPostIds } }, { author_id: { in: demoUserIds } }, { community_id: { in: demoCommunityIds } }, { activity_id: { in: demoActivityIds } }] } }),
    prisma.activities.deleteMany({ where: { OR: [{ id: { in: demoActivityIds } }, { creator_id: { in: demoUserIds } }, { community_id: { in: demoCommunityIds } }] } }),
    prisma.community_members.deleteMany({ where: { OR: [{ user_id: { in: demoUserIds } }, { community_id: { in: demoCommunityIds } }] } }),
    prisma.community_interests.deleteMany({ where: { community_id: { in: demoCommunityIds } } }),
    prisma.community_vibe_tags.deleteMany({ where: { community_id: { in: demoCommunityIds } } }),
    prisma.follows.deleteMany({ where: { OR: [{ follower_id: { in: demoUserIds } }, { following_id: { in: demoUserIds } }] } }),
    prisma.user_languages.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.user_interests.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.user_vibe_tags.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.user_activity_preferences.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.verification_requests.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.communities.deleteMany({ where: { id: { in: demoCommunityIds } } }),
    prisma.profiles.deleteMany({ where: { user_id: { in: demoUserIds } } }),
    prisma.users.deleteMany({ where: { id: { in: demoUserIds } } }),
  ]);
}

async function upsertLookupTable(prisma, model, items) {
  const created = [];

  for (const item of items) {
    const record = await prisma[model].upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
    created.push(record);
  }

  return created;
}

async function seedReferenceData(prisma, world) {
  const interests = await upsertLookupTable(prisma, "interests", world.interests.map((name) => ({ name, slug: slugify(name) })));
  const languages = await Promise.all(
    world.languages.map((language) =>
      prisma.languages.upsert({
        where: { name: language.name },
        update: language,
        create: language,
      }),
    ),
  );
  const vibeTags = await upsertLookupTable(prisma, "vibe_tags", world.vibeTags.map((name) => ({ name, slug: slugify(name) })));
  const activityCategories = await upsertLookupTable(
    prisma,
    "activity_categories",
    world.activityCategories.map((name) => ({ name, slug: slugify(name) })),
  );

  return {
    interestsByName: new Map(interests.map((item) => [item.name, item.id])),
    languagesByName: new Map(languages.map((item) => [item.name, item.id])),
    vibeTagsByName: new Map(vibeTags.map((item) => [item.name, item.id])),
    activityCategoriesByName: new Map(activityCategories.map((item) => [item.name, item.id])),
  };
}

async function createUserProfile(prisma, userSeed, lookup, passwordHash, index, baseDate) {
  const createdAt = daysAgo(baseDate, 20 - index, index * 41);
  const user = await prisma.users.create({
    data: {
      email: buildDemoEmail(userSeed.username),
      username: userSeed.username,
      password_hash: passwordHash,
      email_verified: true,
      verification_status: verification_status.VERIFIED,
      created_at: createdAt,
      updated_at: daysAgo(baseDate, 1, index * 9),
      profiles: {
        create: {
          full_name: getFullName(userSeed),
          bio: userSeed.bio,
          city: userSeed.city,
          country: userSeed.country,
          social_mode: social_mode[userSeed.socialMode],
          profile_visibility: profile_visibility[userSeed.visibility],
          avatar_url: createAvatarUrl(userSeed.username),
          cover_url: createBannerDataUri(`profile-${userSeed.username}`, `${getFullName(userSeed)} banner`),
          created_at: createdAt,
          updated_at: daysAgo(baseDate, 1, index * 7),
        },
      },
    },
    include: { profiles: true },
  });

  await prisma.user_languages.createMany({ data: userSeed.languages.map((name) => ({ user_id: user.id, language_id: lookup.languagesByName.get(name) })) });
  await prisma.user_interests.createMany({ data: userSeed.interests.map((name) => ({ user_id: user.id, interest_id: lookup.interestsByName.get(name) })) });
  await prisma.user_vibe_tags.createMany({ data: userSeed.vibeTags.map((name) => ({ user_id: user.id, vibe_tag_id: lookup.vibeTagsByName.get(name) })) });
  await prisma.user_activity_preferences.createMany({
    data: userSeed.activityCategories.map((name) => ({ user_id: user.id, category_id: lookup.activityCategoriesByName.get(name) })),
  });

  return user;
}

async function createCommunity(prisma, communitySeed, lookup, owner, index, baseDate) {
  const createdAt = daysAgo(baseDate, 17 - index, index * 52);
  const community = await prisma.communities.create({
    data: {
      owner_id: owner.id,
      name: communitySeed.name,
      slug: communitySeed.slug,
      description: communitySeed.description,
      city: communitySeed.city,
      country: communitySeed.country,
      visibility: community_visibility.PUBLIC,
      cover_url: createBannerDataUri(`community-${communitySeed.slug}`, `${communitySeed.name} cover`),
      category: communitySeed.category,
      created_at: createdAt,
      updated_at: daysAgo(baseDate, randomInt(createRng(`community-${communitySeed.slug}`), 0, 6), index * 13),
    },
  });

  await prisma.community_interests.createMany({ data: communitySeed.interests.map((name) => ({ community_id: community.id, interest_id: lookup.interestsByName.get(name) })) });
  await prisma.community_vibe_tags.createMany({ data: communitySeed.vibeTags.map((name) => ({ community_id: community.id, vibe_tag_id: lookup.vibeTagsByName.get(name) })) });
  await prisma.community_members.create({
    data: {
      community_id: community.id,
      user_id: owner.id,
      role: "OWNER",
      joined_at: createdAt,
    },
  });

  return community;
}

async function createCommunityMemberships(prisma, users, communitiesMap, baseDate) {
  const memberships = [];

  for (const communitySeed of communitySeeds) {
    const community = communitiesMap.get(communitySeed.slug);
    const ownerId = community.owner_id;
    const scoredMembers = users
      .filter((user) => user.id !== ownerId)
      .map((user) => {
        const sharedInterests = user.seed.interests.filter((interest) => communitySeed.interests.includes(interest)).length;
        const sharedVibes = user.seed.vibeTags.filter((tag) => communitySeed.vibeTags.includes(tag)).length;
        const sameCity = user.seed.city === communitySeed.city ? 2 : 0;

        return { user, score: sharedInterests * 3 + sharedVibes * 2 + sameCity };
      })
      .filter((entry) => entry.score >= 2)
      .sort((left, right) => right.score - left.score)
      .slice(0, 7);

    for (const [index, entry] of scoredMembers.entries()) {
      memberships.push({
        community_id: community.id,
        user_id: entry.user.id,
        role: "MEMBER",
        joined_at: daysAgo(baseDate, 14 - index, index * 29),
      });
    }
  }

  await prisma.community_members.createMany({ data: memberships, skipDuplicates: true });
  return memberships.length;
}

function buildPostRecord(user, topic, sequenceIndex, community, baseDate) {
  const rng = createRng(`post-${user.username}-${sequenceIndex}-${community ? community.slug : "home"}`);
  const content = pick(rng, topicPosts[topic] || topicPosts.Coffee);
  const createdAt = daysAgo(baseDate, randomInt(rng, 1, 19), randomInt(rng, 0, 1200));

  return {
    authorUsername: user.username,
    communitySlug: community ? community.slug : null,
    topic,
    content,
    created_at: createdAt,
    updated_at: new Date(createdAt.getTime() + randomInt(rng, 10, 180) * 60 * 1000),
    location_text: rng() < 0.35 ? `${user.city}${rng() < 0.45 ? " city center" : ""}` : null,
    image_url:
      (topic === "Photography" || topic === "Travel") && rng() < 0.55
        ? createBannerDataUri(`post-${user.username}-${sequenceIndex}`, `${user.firstName} post image`)
        : null,
    title: null,
    post_type: community ? "COMMUNITY_POST" : "STANDARD_POST",
    invite_visibility: invite_visibility.PUBLIC,
  };
}

async function createPosts(prisma, users, communitiesMap, baseDate) {
  const posts = [];

  for (const user of users) {
    const postCount = getPostCount(user.seed);
    const memberships = user.memberships.map((slug) => communitiesMap.get(slug)).filter(Boolean);

    for (let index = 0; index < postCount; index += 1) {
      const topic = getPostTopic(user.seed, index);
      const community = memberships[index % Math.max(1, memberships.length)] || null;
      const useCommunity = community && index % 2 === 0;
      posts.push(buildPostRecord(user.seed, topic, index, useCommunity ? community : null, baseDate));
    }
  }

  const createdPosts = [];

  for (const post of posts) {
    createdPosts.push(
      await prisma.posts.create({
        data: {
          author_id: users.find((user) => user.seed.username === post.authorUsername).id,
          community_id: post.communitySlug ? communitiesMap.get(post.communitySlug).id : null,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          updated_at: post.updated_at,
          location_text: post.location_text,
          title: post.title,
          post_type: post.post_type,
          invite_visibility: post.invite_visibility,
        },
      }),
    );
  }

  return createdPosts;
}

async function createEvents(prisma, usersByUsername, communitiesMap, lookup, baseDate) {
  const createdActivities = [];
  const createdPosts = [];

  for (const [index, event] of eventPlans.entries()) {
    const createdAt = daysAgo(baseDate, 8 - index, index * 37);
    const startTime = daysFromNow(baseDate, event.daysAhead, 18 * 60 + index * 25);
    const creator = usersByUsername.get(event.creator);
    const community = event.communitySlug ? communitiesMap.get(event.communitySlug) : null;
    const activity = await prisma.activities.create({
      data: {
        creator_id: creator.id,
        community_id: community ? community.id : null,
        category_id: lookup.activityCategoriesByName.get(event.category),
        title: event.title,
        description: event.content,
        location_text: event.locationText,
        city: event.city,
        country: event.country,
        start_time: startTime,
        max_participants: event.maxParticipants,
        image_url: createBannerDataUri(`activity-${slugify(event.title)}`, event.title),
        invite_visibility: event.inviteVisibility,
        created_at: createdAt,
        updated_at: createdAt,
        activity_participants: {
          create: [
            { user_id: creator.id, joined_at: createdAt },
            ...event.participants.map((username, participantIndex) => ({
              user_id: usersByUsername.get(username).id,
              joined_at: new Date(createdAt.getTime() + (participantIndex + 1) * 25 * 60 * 1000),
            })),
          ],
        },
      },
      include: { activity_participants: true },
    });
    const post = await prisma.posts.create({
      data: {
        author_id: creator.id,
        community_id: community ? community.id : null,
        activity_id: activity.id,
        content: event.content,
        title: event.title,
        location_text: event.locationText,
        starts_at: startTime,
        max_participants: event.maxParticipants,
        image_url: activity.image_url,
        post_type: event.postType,
        invite_visibility: event.inviteVisibility,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });

    createdActivities.push(activity);
    createdPosts.push(post);
  }

  return { createdActivities, createdPosts };
}

async function createComments(prisma, posts, users) {
  const createdComments = [];

  for (const [index, post] of posts.entries()) {
    const rng = createRng(`comments-${post.id}`);
    const commentCount = index % 8 === 0 ? randomInt(rng, 0, 1) : index % 5 === 0 ? randomInt(rng, 4, 6) : randomInt(rng, 1, 3);
    const author = users.find((user) => user.id === post.author_id);
    const topic = getPostTopic(author.seed, index);
    const candidates = users.filter((user) => user.id !== post.author_id);
    const commenters = sampleSize(rng, candidates, Math.min(commentCount, candidates.length));

    for (const [commentIndex, commenter] of commenters.entries()) {
      const content = pick(rng, getTopicCommentPool(topic));
      createdComments.push(
        await prisma.post_comments.create({
          data: {
            post_id: post.id,
            user_id: commenter.id,
            content,
            created_at: new Date(post.created_at.getTime() + (commentIndex + 1) * 45 * 60 * 1000),
            updated_at: new Date(post.created_at.getTime() + (commentIndex + 1) * 45 * 60 * 1000),
          },
        }),
      );
    }
  }

  return createdComments;
}

async function createFollowGraph(prisma, users) {
  const follows = [];

  for (const user of users) {
    const rng = createRng(`follow-${user.seed.username}`);
    const candidates = users
      .filter((candidate) => candidate.id !== user.id)
      .map((candidate) => {
        const sharedInterests = candidate.seed.interests.filter((interest) => user.seed.interests.includes(interest)).length;
        const sharedVibes = candidate.seed.vibeTags.filter((tag) => user.seed.vibeTags.includes(tag)).length;
        const sameCity = candidate.seed.city === user.seed.city ? 1 : 0;

        return { candidate, score: sharedInterests * 3 + sharedVibes * 2 + sameCity };
      })
      .filter((entry) => entry.score >= 2);
    const desiredCount = user.seed.activityLevel === "high" ? 5 : user.seed.activityLevel === "medium" ? 3 : 2;

    for (const entry of shuffle(rng, candidates).slice(0, desiredCount)) {
      follows.push({
        follower_id: user.id,
        following_id: entry.candidate.id,
        created_at: daysAgo(new Date(), randomInt(rng, 1, 18), randomInt(rng, 0, 900)),
      });
    }
  }

  await prisma.follows.createMany({ data: follows, skipDuplicates: true });
  return follows;
}

async function createLikes(prisma, posts, users) {
  const likes = [];

  for (const [index, post] of posts.entries()) {
    const rng = createRng(`likes-${post.id}`);
    const potentialLikers = users.filter((user) => user.id !== post.author_id);
    const likeCount = index % 4 === 0 ? randomInt(rng, 0, 2) : randomInt(rng, 3, 7);

    for (const liker of sampleSize(rng, potentialLikers, likeCount)) {
      likes.push({
        post_id: post.id,
        user_id: liker.id,
        created_at: new Date(post.created_at.getTime() + randomInt(rng, 60, 720) * 60 * 1000),
      });
    }
  }

  await prisma.post_likes.createMany({ data: likes, skipDuplicates: true });
  return likes;
}

async function createMessages(prisma, usersByUsername, communitiesMap, baseDate) {
  let directMessageCount = 0;
  let communityChatMessageCount = 0;

  for (const [index, plan] of directMessagePlans.entries()) {
    const createdAt = daysAgo(baseDate, 9 - index, index * 55);
    const thread = await prisma.direct_message_threads.create({
      data: { created_at: createdAt, updated_at: createdAt },
    });
    const participants = plan.pair.map((username) => usersByUsername.get(username));

    await prisma.direct_message_thread_participants.createMany({
      data: participants.map((participant) => ({
        thread_id: thread.id,
        user_id: participant.id,
        joined_at: createdAt,
      })),
    });

    for (const [messageIndex, message] of plan.messages.entries()) {
      const sender = participants[messageIndex % 2];
      const messageCreatedAt = new Date(createdAt.getTime() + messageIndex * 36 * 60 * 1000);
      await prisma.direct_messages.create({
        data: {
          thread_id: thread.id,
          sender_id: sender.id,
          message,
          created_at: messageCreatedAt,
          updated_at: messageCreatedAt,
        },
      });
      directMessageCount += 1;
    }

    await prisma.direct_message_threads.update({
      where: { id: thread.id },
      data: {
        updated_at: new Date(createdAt.getTime() + (plan.messages.length + 1) * 36 * 60 * 1000),
      },
    });
  }

  for (const [index, plan] of communityChatPlans.entries()) {
    const community = communitiesMap.get(plan.communitySlug);
    const chatCreatedAt = daysAgo(baseDate, 6 - index, index * 43);
    const chat = await prisma.community_chats.create({
      data: {
        community_id: community.id,
        created_at: chatCreatedAt,
        updated_at: chatCreatedAt,
      },
    });

    for (const [messageIndex, [username, message]] of plan.entries.entries()) {
      const createdAt = new Date(chatCreatedAt.getTime() + messageIndex * 22 * 60 * 1000);
      await prisma.community_chat_messages.create({
        data: {
          community_chat_id: chat.id,
          sender_id: usersByUsername.get(username).id,
          message,
          created_at: createdAt,
          updated_at: createdAt,
        },
      });
      communityChatMessageCount += 1;
    }

    await prisma.community_chats.update({
      where: { id: chat.id },
      data: {
        updated_at: new Date(chatCreatedAt.getTime() + plan.entries.length * 22 * 60 * 1000),
      },
    });
  }

  return {
    communityChatMessageCount,
    directMessageCount,
    threadCount: directMessagePlans.length,
  };
}

async function createNotifications(prisma, follows, likes, membershipsCount, activities, users) {
  const notifications = [];
  const usersById = new Map(users.map((user) => [user.id, user]));
  const likesByPostId = new Map();

  for (const like of likes) {
    if (!likesByPostId.has(like.post_id)) {
      likesByPostId.set(like.post_id, []);
    }
    likesByPostId.get(like.post_id).push(like);
  }

  for (const follow of follows.slice(0, 18)) {
    notifications.push({
      user_id: follow.following_id,
      actor_id: follow.follower_id,
      related_user_id: follow.follower_id,
      type: "FOLLOWED",
      title: "started following you",
      body: null,
      created_at: follow.created_at,
      read: false,
    });
  }

  for (const [index, activity] of activities.entries()) {
    for (const participant of activity.activity_participants.slice(1, 4)) {
      notifications.push({
        user_id: activity.creator_id,
        actor_id: participant.user_id,
        related_user_id: participant.user_id,
        related_activity_id: activity.id,
        type: "ACTIVITY_JOINED",
        title: "joined your activity",
        body: activity.title,
        created_at: new Date(activity.created_at.getTime() + (index + 1) * 50 * 60 * 1000),
        read: index % 2 === 0,
      });
    }
  }

  const postRows = await prisma.posts.findMany({
    where: { id: { in: Array.from(likesByPostId.keys()) } },
    select: { id: true, author_id: true, title: true },
  });
  const postsById = new Map(postRows.map((post) => [post.id, post]));

  for (const like of likes.slice(0, 30)) {
    const post = postsById.get(like.post_id);
    if (!post || post.author_id === like.user_id) {
      continue;
    }

    notifications.push({
      user_id: post.author_id,
      actor_id: like.user_id,
      related_user_id: like.user_id,
      related_post_id: post.id,
      type: "POST_LIKED",
      title: "liked your post",
      body: post.title,
      created_at: like.created_at,
      read: false,
    });
  }

  const membershipRows = await prisma.community_members.findMany({
    where: { role: "MEMBER" },
    include: { communities: { select: { id: true, owner_id: true, name: true } } },
    take: membershipsCount,
  });

  for (const membership of membershipRows.slice(0, 20)) {
    notifications.push({
      user_id: membership.communities.owner_id,
      actor_id: membership.user_id,
      related_user_id: membership.user_id,
      related_community_id: membership.community_id,
      type: "COMMUNITY_JOINED",
      title: "joined your community",
      body: membership.communities.name,
      created_at: membership.joined_at,
      read: usersById.get(membership.communities.owner_id)?.seed.activityLevel === "low",
    });
  }

  await prisma.notifications.createMany({ data: notifications });
  return notifications.length;
}

async function seedDemoWorld(prisma, world) {
  const baseDate = new Date("2026-04-08T12:00:00.000Z");

  await resetDemoData(prisma);
  const lookup = await seedReferenceData(prisma, world);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];

  for (const [index, userSeed] of world.userArchetypes.entries()) {
    const user = await createUserProfile(prisma, userSeed, lookup, passwordHash, index, baseDate);
    users.push({ ...user, seed: userSeed, memberships: [] });
  }

  const usersByUsername = new Map(users.map((user) => [user.seed.username, user]));
  const createdCommunities = [];

  for (const [index, communitySeed] of world.communities.entries()) {
    const owner = usersByUsername.get(communitySeed.ownerUsername);
    const community = await createCommunity(prisma, communitySeed, lookup, owner, index, baseDate);
    createdCommunities.push(community);
    owner.memberships.push(communitySeed.slug);
  }

  const communitiesMap = new Map(createdCommunities.map((community) => [community.slug, community]));
  const membershipCount = await createCommunityMemberships(prisma, users, communitiesMap, baseDate);
  const membershipRows = await prisma.community_members.findMany({
    where: { user_id: { in: users.map((user) => user.id) } },
    include: { communities: { select: { slug: true } } },
  });

  for (const user of users) {
    user.memberships = membershipRows.filter((membership) => membership.user_id === user.id).map((membership) => membership.communities.slug);
  }

  const standardPosts = await createPosts(prisma, users, communitiesMap, baseDate);
  const { createdActivities, createdPosts: eventPosts } = await createEvents(prisma, usersByUsername, communitiesMap, lookup, baseDate);
  const allPosts = [...standardPosts, ...eventPosts];
  const createdComments = await createComments(prisma, allPosts, users);
  const follows = await createFollowGraph(prisma, users);
  const likes = await createLikes(prisma, allPosts, users);
  const messages = await createMessages(prisma, usersByUsername, communitiesMap, baseDate);
  const notificationCount = await createNotifications(prisma, follows, likes, membershipCount, createdActivities, users);

  return {
    counts: {
      users: users.length,
      profiles: users.length,
      communities: createdCommunities.length,
      communityMemberships: membershipCount + createdCommunities.length,
      posts: allPosts.length,
      comments: createdComments.length,
      likes: likes.length,
      follows: follows.length,
      activities: createdActivities.length,
      activityParticipants: createdActivities.reduce((total, activity) => total + activity.activity_participants.length, 0),
      directMessageThreads: messages.threadCount,
      directMessages: messages.directMessageCount,
      communityChatMessages: messages.communityChatMessageCount,
      notifications: notificationCount,
    },
    demoPassword: DEMO_PASSWORD,
  };
}

module.exports = {
  createComment: createComments,
  createCommunity,
  createEvents,
  createFollowGraph,
  createMessages,
  createPost: createPosts,
  createUserProfile,
  resetDemoData,
  seedDemoWorld,
};
