// campaign.js
// Time-stamp: "2019-04-20 10:03:14 queinnec"

import CodeGradX from '../CodeGradX.mjs';

/** Get the campaigns where the current user is enrolled.

      @param {bool} now - if true get only active campaigns.
      @returns {Promise<Hashtable<Campaign>>} yielding a Hashtable of Campaigns
                indexed by their name.

   The current user maintains in _campaigns the hash of active
   campaigns and in hash _all_campaigns all past or current campaigns.
   Three cases are possible:
      - both are defined
      - only _campaigns is defined (see constructor 'User')
      - none are defined

    */

CodeGradX.User.prototype.getCampaigns = function (now) {
    const user = this;
    function filterActive (campaigns) {
        const activeCampaigns = {};
        for ( let key of Object.keys(campaigns) {
            let campaign = campaigns[key];
            if ( campaign.active ) {
                activeCampaigns[campaign.name] = campaign;
            }
        });
        return activeCampaigns;
    }
    if ( now ) {
        if ( user._campaigns ) {
            // return all current campaigns:
            return Promise.resolve(user._campaigns);
        } else if ( user._all_campaigns ) {
            // generate all current campaigns:
            user._campaigns = filterActive(user._all_campaigns);
            return Promise.resolve(user._campaigns);
        }
    }
    if ( user._all_campaigns ) {
        if ( now ) {
            user._campaigns = filterActive(user._all_campaigns);
            return Promise.resolve(user._campaigns);
        } else {
            return Promise.resolve(user._all_campaigns);
        }
    } else {
        const state = CodeGradX.getCurrentState();
        state.debug('getAllCampaigns1');
        return state.sendAXServer('x', {
            path: '/campaigns/',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (response) {
            state.debug('getAllCampaigns2', response);
            const campaigns = {};
            response.entity.forEach(function (js) {
                //console.log(js);
                const campaign = new CodeGradX.Campaign(js);
                campaigns[campaign.name] = campaign;
            });
            user._all_campaigns = campaigns;
            user._campaigns = filterActive(user._all_campaigns);
            if ( now ) {
                return Promise.resolve(user._campaigns);
            } else {
                return Promise.resolve(user._all_campaigns);
            }
        });
    }
};

/** Return a specific Campaign. It looks for a named campaign among
    the campaigns the user is part of whether past or current.

        @param {String} name - name of the Campaign to find
        @returns {Promise<Campaign>} yields {Campaign}

    */

CodeGradX.User.prototype.getCampaign = function (name) {
  const user = this;
  const state = CodeGradX.getCurrentState();
  state.debug('getCampaign', name);
  if ( user._campaigns && user._campaigns[name] ) {
      return Promise.resolve(user._campaigns[name]);
  } else if ( user._all_campaigns && user._all_campaigns[name] ) {
      return Promise.resolve(user._all_campaigns[name]);
  } else {
      return user.getCampaigns()
          .then(function (campaigns) {
              if ( campaigns && campaigns[name] ) {
                  return Promise.resolve(campaigns[name]);
              } else {
                  return Promise.reject(new Error("No such campaign " + name));
              }
          });
  }
};

/** Get current campaign if state.currentCampaignName is defined or
    if there is a single active campaign associated to the user.

    @return {Promise<Campaign>} yields {Campaign}
*/

CodeGradX.User.prototype.getCurrentCampaign = function () {
    const user = this;
    const state = CodeGradX.getCurrentState();
    if ( state.currentCampaign ) {
        return Promise.resolve(state.currentCampaign);
    } else if ( state.currentCampaignName ) {
        return user.getCampaign(state.currentCampaignName)
            .then(function (campaign) {
                state.currentCampaign = campaign;
                return Promise.resolve(campaign);
            });
    } else {
        return user.getCampaigns(true)
            .then(function (campaigns) {
                function hash2array (o) {
                    let result = [];
                    Object.keys(o).forEach((key) => {
                        result.push(o[key]);
                    });
                    return result;
                }
                campaigns = hash2array(campaigns);
                if ( campaigns.length === 1 ) {
                    state.currentCampaignName = campaigns[0].name;
                    state.currentCampaign = campaigns[0];
                    return Promise.resolve(campaigns[0]);
                } else if ( state.currentCampaign ) { 
                    return Promise.resolve(state.currentCampaign);
                } else {
                    const msg = "Cannot determine current campaign";
                    return Promise.reject(new Error(msg));
                }
            });
    }
};
CodeGradX.User.prototype.getCurrentCampaign.default = {
    currentCampaign: undefined
};

// end of campaign.js
