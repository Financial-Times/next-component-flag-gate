module.exports = {

    topicCard: {
        isFollowable: {on: ['userPreferences', 'following')]}
    },

    stream: {
        hasPagination: {on: ['pagination']},
        isFollowable: {on: ['userPreferences', 'following']},
        hasRelatedStoryPackages: {on: ['storyPackagesInStream']},
        hasRelatedVideos: {on: ['brightcoveApi', 'relatedVideoInStream']},
        hasAds: {on: ['ads']},
    }
};