// Generated by CoffeeScript 1.3.3
(function() {
  var Github;

  Github = (function() {
    var Gist, Repository, User, listeners, _request;

    _request = null;

    listeners = [];

    function Github(options) {
      options.rootURL = options.rootURL || 'https://api.github.com';
      listeners = [];
      _request = function(method, path, data, raw) {
        var deferred, getURL, xhr,
          _this = this;
        getURL = function() {
          var url;
          url = options.rootURL + path;
          return url + (/\?/.test(url) ? '&' : '?') + (new Date()).getTime();
        };
        xhr = jQuery.ajax({
          url: getURL(),
          type: method,
          contentType: 'application/json',
          headers: {
            'Accept': 'application/vnd.github.raw'
          },
          processData: false,
          data: data,
          dataType: !raw ? 'json' : void 0,
          beforeSend: function(xhr) {
            var auth;
            if ((options.auth === 'oauth' && options.token) || (options.auth === 'basic' && options.username && options.password)) {
              if (options.auth === 'oauth') {
                auth = "token " + options.token;
              } else {
                auth = 'Basic ' + Base64.encode("" + options.username + ":" + options.password);
              }
              return xhr.setRequestHeader('Authorization', auth);
            }
          },
          complete: function(xhr, xmlhttpr) {
            var rateLimit, rateLimitRemaining;
            rateLimit = parseFloat(xhr.getResponseHeader('X-RateLimit-Limit'));
            rateLimitRemaining = parseFloat(xhr.getResponseHeader('X-RateLimit-Remaining'));
            return jQuery.each(listeners, function(i, listener) {
              return listener(rateLimitRemaining, rateLimit);
            });
          }
        });
        deferred = new jQuery.Deferred();
        xhr.done(function() {
          return deferred.resolve.apply(this, arguments);
        });
        xhr.fail(function(xhr, msg, desc) {
          var json;
          if (xhr.getResponseHeader('Content-Type') !== 'application/json; charset=utf-8') {
            return deferred.reject(xhr.responseText, xhr.status, xhr);
          }
          json = JSON.parse(xhr.responseText);
          return deferred.reject(json, xhr.status, xhr);
        });
        return deferred.promise();
      };
    }

    Github.prototype.onRateLimitChanged = function(listener) {
      return listeners.push(listener);
    };

    User = (function() {

      function User() {}

      User.prototype.repos = function() {
        return _request('GET', '/user/repos?type=all&per_page=1000&sort=updated', null);
      };

      User.prototype.orgs = function() {
        return _request('GET', '/user/orgs', null);
      };

      User.prototype.gists = function() {
        return _request('GET', '/gists', null);
      };

      User.prototype.show = function(username) {
        var command;
        command = (username ? "/users/" + username : '/user');
        return _request('GET', command, null);
      };

      User.prototype.userRepos = function(username) {
        return _request('GET', "/users/" + username + "/repos?type=all&per_page=1000&sort=updated", null);
      };

      User.prototype.userGists = function(username) {
        return _request('GET', "/users/" + username + "/gists", null);
      };

      User.prototype.orgRepos = function(orgname) {
        return _request('GET', "/orgs/" + orgname + "/repos?type=all&per_page=1000&sort=updated&direction=desc", null);
      };

      User.prototype.follow = function(username) {
        return _request('PUT', "/user/following/" + username, null);
      };

      User.prototype.unfollow = function(username) {
        return _request('DELETE', "/user/following/" + username, null);
      };

      return User;

    })();

    Repository = (function() {
      var updateTree;

      function Repository(options) {
        var repo, user;
        this.options = options;
        repo = this.options.name;
        user = this.options.user;
        this.repoPath = "/repos/" + user + "/" + repo;
        this.currentTree = {
          branch: null,
          sha: null
        };
      }

      updateTree = function(branch) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        if (branch === this.currentTree.branch && this.currentTree.sha) {
          return deferred.resolve(this.currentTree.sha);
        }
        this.getRef("heads/" + branch).done(function(sha) {
          _this.currentTree.branch = branch;
          _this.currentTree.sha = sha;
          return deferred.resolve(sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.getRef = function(ref) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        _request('GET', "" + this.repoPath + "/git/refs/" + ref, null).done(function(res) {
          return deferred.resolve(res.object.sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.createRef = function(options) {
        return _request('POST', "" + this.repoPath + "/git/refs", options);
      };

      Repository.prototype.deleteRef = function(ref) {
        return _request('DELETE', "" + this.repoPath + "/git/refs/" + ref, this.options);
      };

      Repository.prototype.listBranches = function() {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        _request('GET', "" + this.repoPath + "/git/refs/heads", null).done(function(heads) {
          return deferred.resolve(_.map(heads, function(head) {
            return _.last(head.ref.split("/"));
          }));
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.getBlob = function(sha) {
        return _request('GET', "" + this.repoPath + "/git/blobs/" + sha, null, 'raw');
      };

      Repository.prototype.getSha = function(branch, path) {
        var deferred,
          _this = this;
        if (path === '') {
          return this.getRef("heads/" + branch);
        }
        deferred = new jQuery.Deferred();
        this.getTree("" + branch + "?recursive=true").done(function(tree) {
          var file;
          file = _.select(tree, function(file) {
            return file.path === path;
          })[0];
          return deferred.resolve((file != null ? file.sha : void 0) || null);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.getTree = function(tree) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        _request('GET', "" + this.repoPath + "/git/trees/" + tree, null).done(function(res) {
          return deferred.resolve(res.tree);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.postBlob = function(content) {
        var deferred,
          _this = this;
        if (typeof content === 'string') {
          content = {
            content: content,
            encoding: 'utf-8'
          };
        }
        deferred = new jQuery.Deferred();
        _request('POST', "" + this.repoPath + "/git/blobs", content).done(function(res) {
          return deferred.resolve(res.sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.updateTree = function(baseTree, path, blob) {
        var data, deferred,
          _this = this;
        data = {
          base_tree: baseTree,
          tree: [
            {
              path: path,
              mode: '100644',
              type: 'blob',
              sha: blob
            }
          ]
        };
        deferred = new jQuery.Deferred();
        _request('POST', "" + this.repoPath + "/git/trees", data).done(function(res) {
          return deferred.resolve(res.sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.postTree = function(tree) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        _request('POST', "" + this.repoPath + "/git/trees", {
          tree: tree
        }).done(function(res) {
          return deferred.resolve(res.sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.commit = function(parent, tree, message) {
        var data, deferred,
          _this = this;
        data = {
          message: message,
          author: {
            name: this.options.username
          },
          parents: [parent],
          tree: tree
        };
        deferred = new jQuery.Deferred();
        _request('POST', "" + this.repoPath + "/git/commits", data).done(function(res) {
          _this.currentTree.sha = res.sha;
          return deferred.resolve(res.sha);
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.updateHead = function(head, commit) {
        return _request('PATCH', "" + this.repoPath + "/git/refs/heads/" + head, {
          sha: commit
        });
      };

      Repository.prototype.show = function() {
        return _request('GET', this.repoPath, null);
      };

      Repository.prototype.contents = function(branch, path) {
        return _request('GET', "" + this.repoPath + "/contents?ref=" + branch, {
          path: path
        });
      };

      Repository.prototype.fork = function() {
        return _request('POST', "" + this.repoPath + "/forks", null);
      };

      Repository.prototype.createPullRequest = function(options) {
        return _request('POST', "" + this.repoPath + "/pulls", options);
      };

      Repository.prototype.read = function(branch, path) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        this.getSha(branch, path).done(function(sha) {
          if (!sha) {
            deferred.fail("not found");
          }
          return _this.getBlob(sha).done(function(content) {
            return deferred.resolve(content, sha);
          }).fail(function() {
            return deferred.reject.apply(_this, arguments);
          });
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.remove = function(branch, path) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        updateTree(branch).done(function(latestCommit) {
          return _this.getTree("" + latestCommit + "?recursive=true").done(function(tree) {
            var newTree;
            newTree = _.reject(tree, function(ref) {
              return ref.path === path;
            });
            _.each(newTree, function(ref) {
              if (ref.type === 'tree') {
                return delete ref.sha;
              }
            });
            return _this.postTree(newTree).done(function(rootTree) {
              return _this.commit(latestCommit, rootTree, "Deleted " + path).done(function(commit) {
                return _this.updateHead(branch, commit).done(function(res) {
                  return deferred.resolve(res);
                }).fail(function() {
                  return deferred.reject.apply(_this, arguments);
                });
              }).fail(function() {
                return deferred.reject.apply(_this, arguments);
              });
            }).fail(function() {
              return deferred.reject.apply(_this, arguments);
            });
          }).fail(function() {
            return deferred.reject.apply(_this, arguments);
          });
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.move = function(branch, path, newPath) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        updateTree(branch).done(function(latestCommit) {
          return _this.getTree("" + latestCommit + "?recursive=true").done(function(tree) {
            _.each(tree, function(ref) {
              if (ref.path === path) {
                ref.path = newPath;
              }
              if (ref.type === 'tree') {
                return delete ref.sha;
              }
            });
            return _this.postTree(tree).done(function(rootTree) {
              return _this.commit(latestCommit, rootTree, "Deleted " + path).done(function(commit) {
                return _this.updateHead(branch, commit).done(function(res) {
                  return deferred.resolve(res);
                }).fail(function() {
                  return deferred.reject.apply(_this, arguments);
                });
              }).fail(function() {
                return deferred.reject.apply(_this, arguments);
              });
            }).fail(function() {
              return deferred.reject.apply(_this, arguments);
            });
          }).fail(function() {
            return deferred.reject.apply(_this, arguments);
          });
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      Repository.prototype.write = function(branch, path, content, message) {
        var deferred,
          _this = this;
        deferred = new jQuery.Deferred();
        updateTree(branch).done(function(latestCommit) {
          return _this.postBlob(content).done(function(blob) {
            return _this.updateTree(latestCommit, path, blob).done(function(tree) {
              return _this.commit(latestCommit, tree, message).done(function(commit) {
                return _this.updateHead(branch, commit).done(function(res) {
                  return deferred.resolve(res);
                }).fail(function() {
                  return deferred.reject.apply(_this, arguments);
                });
              }).fail(function() {
                return deferred.reject.apply(_this, arguments);
              });
            }).fail(function() {
              return deferred.reject.apply(_this, arguments);
            });
          }).fail(function() {
            return deferred.reject.apply(_this, arguments);
          });
        }).fail(function() {
          return deferred.reject.apply(_this, arguments);
        });
        return deferred.promise();
      };

      return Repository;

    })();

    Gist = (function() {

      function Gist(options) {
        var id;
        this.options = options;
        id = this.options.id;
        this.gistPath = "/gists/" + id;
      }

      Gist.prototype.read = function() {
        return _request('GET', this.gistPath, null);
      };

      Gist.prototype.create = function(options) {
        return _request('POST', "/gists", options);
      };

      Gist.prototype["delete"] = function() {
        return _request('DELETE', this.gistPath, null);
      };

      Gist.prototype.fork = function() {
        return _request('POST', "" + this.gistPath + "/fork", null);
      };

      Gist.prototype.update = function(options) {
        return _request('PATCH', this.gistPath, options);
      };

      return Gist;

    })();

    Github.prototype.getRepo = function(user, repo) {
      return new Repository({
        user: user,
        name: repo
      });
    };

    Github.prototype.getUser = function() {
      return new User();
    };

    Github.prototype.getGist = function(id) {
      return new Gist({
        id: id
      });
    };

    return Github;

  })();

  this.Github = Github;

}).call(this);
