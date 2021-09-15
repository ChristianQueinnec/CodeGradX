// campaign.mjs
// Time-stamp: "2021-09-14 18:03:52 queinnec"

import { CodeGradX as cx } from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
export default CodeGradX;

/** Keep only persistable values and convert then into JSON Do not
    memorize 'isTeacher'. This is not completely safe since another
    user might know of an active campaign to which he does not belong.
*/

CodeGradX.Campaign.prototype.jsonize = function () {
    const campaign = this;
    const keys = [
        'title',
        'active',
        'name',
        'open',
        'exercisesname',
        'starttime',
        'endtime',
        'home_url'
    ];
    return CodeGradX.jsonize(campaign, keys);
};

/** Filter active campaigns. 

    @params {campaigns} - Hashtable<Campaign>
    @returns Hashtable<Campaign>

*/

function filterActive (campaigns) {
    const activeCampaigns = {};
    for ( let key of Object.keys(campaigns) ) {
        let campaign = campaigns[key];
        if ( campaign.active ) {
            activeCampaigns[campaign.name] = campaign;
        }
    }
    return activeCampaigns;
}

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

   In return, the User object is always enriched with 
   _campaigns and _array_campaigns.

   _array_campaigns is the array of all (active or past) campaigns.

   The _campaigns property may also come from /whoami but whoami only
   lists active campaigns.

    */

CodeGradX.User.prototype.getCampaigns = function (now) {
    const user = this;
    const state = CodeGradX.getCurrentState();
    function prepareCampaigns (campaigns) {
        user._all_campaigns = campaigns;
        user._array_campaigns = CodeGradX.hash2array(user._all_campaigns);
        user._campaigns = filterActive(user._all_campaigns);
        // Cache only active campaigns (just as getCurrentUser):
        for ( const campaign of CodeGradX.hash2array(user._campaigns) ) {
            state.cachedCampaign(campaign.name, campaign);
        }
        if ( now ) {
            return Promise.resolve(user._campaigns);
        } else {
            return Promise.resolve(user._all_campaigns);
        }
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
    // now is false or (_campaigns and _all_campaigns are not yet filled):
    if ( user._all_campaigns ) {
        if ( now ) {
            user._campaigns = filterActive(user._all_campaigns);
            return Promise.resolve(user._campaigns);
        } else {
            return Promise.resolve(user._all_campaigns);
        }
    } else {
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
            return prepareCampaigns(campaigns);
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

/** Get all open campaigns (free, scm, unx, cc, etc.)

    @return {Promise<Campaign>} yields {Campaign}
*/

CodeGradX.State.prototype.getOpenCampaigns = function () {
    const state = CodeGradX.getCurrentState();
    if ( state.openCampaigns ) {
        return state.openCampaigns;
    } else {
        return state.sendAXServer('x', {
            path: '/campaigns/open',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (response) {
            state.debug('getOpenCampaign', response);
            state.openCampaigns = {};
            response.entity.forEach(function (js) {
                //console.log(js);
                const campaign = new CodeGradX.Campaign(js);
                state.openCampaigns[campaign.name] = campaign;
                state.cachedCampaign(campaign.name, campaign);
            });
            return Promise.resolve(state.openCampaigns);
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
                campaigns = CodeGradX.hash2array(campaigns);
                if ( campaigns.length === 1 ) {
                    state.currentCampaignName = campaigns[0].name;
                    state.currentCampaign = campaigns[0];
                    return Promise.resolve(campaigns[0]);
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
/** Set current campaign.

    @param {Campaign}
    @returns Promise<Campaign>

*/

CodeGradX.User.prototype.setCurrentCampaign = function (newcampaign) {
    const user = this;
    const state = CodeGradX.getCurrentState();
    state.debug(`setCurrentCampaign ${newcampaign.name}`);
    if ( state.currentCampaign === newcampaign ) {
        return Promise.resolve(state.currentCampaign);
    }
    state.currentCampaignName = undefined;
    state.currentCampaign = undefined;
    return state.sendAXServer('x', {
        path: `/campaigns/join/${newcampaign.name}`,
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        state.debug(`setCurrentCampaign2`, response);
        const campaigns = {};
        response.entity.forEach(function (js) {
            //console.log(js);
            const campaign = new CodeGradX.Campaign(js);
            campaigns[campaign.name] = campaign;
            if ( campaign.name === newcampaign.name ) {
                state.currentCampaignName = campaign.name;
                state.currentCampaign = campaign;
            }
        });
        user._all_campaigns = campaigns;
        user._array_campaigns = CodeGradX.hash2array(user._all_campaigns);
        user._campaigns = filterActive(user._all_campaigns);
        return Promise.resolve(state.currentCampaign);
    });
};

// end of campaign.js
